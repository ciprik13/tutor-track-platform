import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  constructor(private readonly prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, user, ip } = request;

    const mutatingMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
    if (!mutatingMethods.includes(method)) return next.handle();

    const action = this.methodToAction(method);
    const entityType = this.urlToEntityType(url);

    return next.handle().pipe(
      tap(async (responseBody) => {
        if (!user || !entityType) return;
        try {
          await this.prisma.auditLog.create({
            data: {
              userId: user.id,
              action,
              entityType,
              entityId: responseBody?.id ?? null,
              newValue: responseBody ?? null,
              ipAddress: ip,
            },
          });
        } catch (_) {
          // audit log nu blochează niciodată request-ul
        }
      }),
    );
  }

  private methodToAction(method: string): string {
    const map: Record<string, string> = {
      POST: 'CREATE',
      PUT: 'UPDATE',
      PATCH: 'UPDATE',
      DELETE: 'DELETE',
    };
    return map[method] || method;
  }

  private urlToEntityType(url: string): string | null {
    if (url.includes('/students')) return 'student';
    if (url.includes('/lessons')) return 'lesson';
    if (url.includes('/payments')) return 'payment';
    if (url.includes('/users')) return 'user';
    return null;
  }
}