import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  await prisma.auditLog.deleteMany()
  await prisma.payment.deleteMany()
  await prisma.lesson.deleteMany()
  await prisma.student.deleteMany()
  await prisma.googleCalendarToken.deleteMany()
  await prisma.user.deleteMany()

  console.log('🗑️  Cleared existing data')

  // ── Admin ──────────────────────────────────────────────────
  const adminPassword = await bcrypt.hash('admin123', 12)
  const admin = await prisma.user.create({
    data: {
      email:        'admin@tutortrack.com',
      passwordHash: adminPassword,
      name:         'Admin TutorTrack',
      role:         'ADMIN',
      status:       'ACTIVE',
    },
  })
  console.log('👤 Created admin:', admin.email)

  // ── Tutor ──────────────────────────────────────────────────
  const tutorPassword = await bcrypt.hash('tutor123', 12)
  const tutor = await prisma.user.create({
    data: {
      email:        'ciprian@tutortrack.com',
      passwordHash: tutorPassword,
      name:         'Ciprian Moisenco',
      role:         'TUTOR',
      status:       'ACTIVE',
      phone:        '+37369000000',
      timezone:     'Europe/Chisinau',
    },
  })
  console.log('👤 Created tutor:', tutor.email)

  // ── Students ───────────────────────────────────────────────
  const studentsData = [
    {
      name:    'Maria Ionescu',
      subject: 'Matematică',
      grade:   '10',
      status:  'active' as const,
      phone:   '+37369111111',
      email:   'maria@email.com',
      notes:   'Progres excelent la algebră. Lucrăm la geometrie.',
    },
    {
      name:    'Alexandru Popescu',
      subject: 'Fizică',
      grade:   '11',
      status:  'active' as const,
      phone:   '+37369222222',
      email:   'alex@email.com',
      notes:   'Dificultăți la mecanică. Îmbunătățiri vizibile.',
    },
    {
      name:    'Elena Dumitru',
      subject: 'Chimie',
      grade:   '9',
      status:  'active' as const,
      phone:   '+37369333333',
      notes:   'Foarte motivată. Pregătire pentru olimpiadă.',
    },
    {
      name:    'Andrei Ciobanu',
      subject: 'Matematică',
      grade:   '12',
      status:  'active' as const,
      phone:   '+37369444444',
      notes:   'Pregătire BAC. Focalizat pe probleme de probabilitate.',
    },
    {
      name:    'Sofia Rusu',
      subject: 'Informatică',
      grade:   '10',
      status:  'inactive' as const,
      phone:   '+37369555555',
      notes:   'Pauză temporară.',
    },
  ]

  const students = []
  for (const s of studentsData) {
    const student = await prisma.student.create({
      data: {
        ...s,
        tutorId:   tutor.id,
        createdBy: tutor.id,
        updatedBy: tutor.id,
      },
    })
    students.push(student)
  }
  console.log(`👥 Created ${students.length} students`)

  // ── Lessons ────────────────────────────────────────────────
  const now = new Date()
  const lessons = []

  const lessonTemplates = [
    { studentIdx: 0, daysAgo: 1,  hour: 16, duration: 60,  price: 250, isPaid: false },
    { studentIdx: 1, daysAgo: 2,  hour: 18, duration: 90,  price: 350, isPaid: false },
    { studentIdx: 2, daysAgo: 3,  hour: 15, duration: 60,  price: 250, isPaid: true  },
    { studentIdx: 3, daysAgo: 4,  hour: 17, duration: 120, price: 450, isPaid: true  },
    { studentIdx: 0, daysAgo: 8,  hour: 16, duration: 60,  price: 250, isPaid: true  },
    { studentIdx: 1, daysAgo: 9,  hour: 18, duration: 90,  price: 350, isPaid: true  },
    { studentIdx: 2, daysAgo: 10, hour: 15, duration: 60,  price: 250, isPaid: true  },
    { studentIdx: 3, daysAgo: 11, hour: 17, duration: 60,  price: 250, isPaid: true  },
    { studentIdx: 0, daysAgo: 32, hour: 16, duration: 60,  price: 250, isPaid: true  },
    { studentIdx: 1, daysAgo: 33, hour: 18, duration: 90,  price: 350, isPaid: true  },
    { studentIdx: 2, daysAgo: 35, hour: 15, duration: 60,  price: 250, isPaid: true  },
    { studentIdx: 3, daysAgo: 36, hour: 17, duration: 120, price: 450, isPaid: true  },
    { studentIdx: 0, daysAgo: 39, hour: 16, duration: 60,  price: 250, isPaid: true  },
    { studentIdx: 1, daysAgo: 40, hour: 18, duration: 60,  price: 250, isPaid: true  },
    { studentIdx: 3, daysAgo: 42, hour: 17, duration: 90,  price: 350, isPaid: true  },
  ]

  for (const t of lessonTemplates) {
    const student = students[t.studentIdx]
    const date = new Date(now)
    date.setDate(date.getDate() - t.daysAgo)
    date.setHours(t.hour, 0, 0, 0)

    const lesson = await prisma.lesson.create({
      data: {
        tutorId:             tutor.id,
        studentId:           student.id,
        date,
        durationMinutes:     t.duration,
        price:               t.price,
        isPaid:              t.isPaid,
        gradeSnapshot:       student.grade,
        studentNameSnapshot: student.name,
        subjectSnapshot:     student.subject ?? '',
        createdBy:           tutor.id,
        updatedBy:           tutor.id,
      },
    })
    lessons.push(lesson)
  }
  console.log(`📚 Created ${lessons.length} lessons`)

  // ── Payments ───────────────────────────────────────────────
  const paidLessons = lessons.filter(l => l.isPaid)
  let paymentsCount = 0

  for (const lesson of paidLessons) {
    const month = lesson.date.toISOString().slice(0, 7)
    await prisma.payment.create({
      data: {
        tutorId:   tutor.id,
        studentId: lesson.studentId,
        lessonId:  lesson.id,
        amount:    lesson.price,
        month,
        status:    'paid',
        paidAt:    lesson.date,
        createdBy: tutor.id,
        updatedBy: tutor.id,
      },
    })
    paymentsCount++
  }
  console.log(`💰 Created ${paymentsCount} payments`)

  console.log('\n✅ Seed completed!')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('🔑 Login credentials:')
  console.log('   Tutor: ciprian@tutortrack.com / tutor123')
  console.log('   Admin: admin@tutortrack.com / admin123')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
}

main()
  .catch(e => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
  