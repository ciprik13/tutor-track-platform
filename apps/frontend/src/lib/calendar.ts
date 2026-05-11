export interface CalendarEvent {
  id: string
  summary: string
  start: { dateTime?: string; date?: string }
  end: { dateTime?: string; date?: string }
  description?: string
  calendarName?: string
  mergedIds?: string[] // set when consecutive same-student events are merged
}

interface CalendarListEntry {
  id: string
  summary: string
  accessRole: string
}

async function fetchCalendarList(token: string): Promise<CalendarListEntry[]> {
  const response = await fetch(
    'https://www.googleapis.com/calendar/v3/users/me/calendarList',
    { headers: { Authorization: `Bearer ${token}` } }
  )
  if (response.status === 401) throw new Error('TOKEN_EXPIRED')
  if (!response.ok) throw new Error('Failed to fetch calendar list')
  const data = await response.json()
  return data.items ?? []
}

async function fetchEventsFromCalendar(
  token: string,
  calendarId: string,
  calendarName: string,
  timeMin: string,
  timeMax: string,
): Promise<CalendarEvent[]> {
  const params = new URLSearchParams({
    timeMin,
    timeMax,
    singleEvents: 'true',
    orderBy: 'startTime',
    maxResults: '250',
  })
  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?${params}`,
    { headers: { Authorization: `Bearer ${token}` } }
  )
  if (!response.ok) return []
  const data = await response.json()
  return (data.items ?? []).map((e: CalendarEvent) => ({ ...e, calendarName }))
}

// Skip read-only subscription calendars (holidays, birthdays, etc.)
const SKIP_ROLES = new Set(['freeBusyReader'])
const SKIP_KEYWORDS = ['holiday', 'sărbătoare', 'birthday', 'zi de naştere', 'contacts']

function shouldSkipCalendar(cal: CalendarListEntry): boolean {
  if (SKIP_ROLES.has(cal.accessRole)) return true
  const name = cal.summary.toLowerCase()
  return SKIP_KEYWORDS.some(kw => name.includes(kw))
}

export async function fetchCalendarEvents(
  token: string,
  month: string,
): Promise<CalendarEvent[]> {
  const [year, m] = month.split('-').map(Number)
  const timeMin = new Date(year, m - 1, 1).toISOString()
  const timeMax = new Date(year, m, 0, 23, 59, 59).toISOString()

  const calendars = await fetchCalendarList(token)
  const eligible = calendars.filter(cal => !shouldSkipCalendar(cal))

  const results = await Promise.allSettled(
    eligible.map(cal => fetchEventsFromCalendar(token, cal.id, cal.summary, timeMin, timeMax))
  )

  // Merge + deduplicate by event id
  const seen = new Set<string>()
  const allEvents: CalendarEvent[] = []
  for (const result of results) {
    if (result.status === 'fulfilled') {
      for (const event of result.value) {
        if (!seen.has(event.id)) {
          seen.add(event.id)
          allEvents.push(event)
        }
      }
    }
  }

  return allEvents.sort((a, b) => {
    const ta = a.start.dateTime ?? a.start.date ?? ''
    const tb = b.start.dateTime ?? b.start.date ?? ''
    return ta.localeCompare(tb)
  })
}
