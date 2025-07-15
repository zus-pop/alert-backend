import { createKeyv } from '@keyv/redis';
import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { AppService } from './app.service';
import { AiModule } from './modules/ai/ai.module';
import { AlertModule } from './modules/alert/alert.module';
import { AttendanceModule } from './modules/attendance/attendance.module';
import { AuthModule } from './modules/auth/auth.module';
import { CourseModule } from './modules/course/course.module';
import { EnrollmentModule } from './modules/enrollment/enrollment.module';
import { QueueModule } from './modules/queue/queue.module';
import { SemesterModule } from './modules/semester/semester.module';
import { SessionModule } from './modules/session/session.module';
import { StudentModule } from './modules/student/student.module';
import { SubjectModule } from './modules/subject/subject.module';
import { SystemUserModule } from './modules/system-user/system-user.module';
import { FirebaseModule } from './shared/firebase/firebase.module';
import { HttpCacheInterceptor } from './shared/interceptor';
import { RedisModule } from './shared/redis/redis.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { NotificationModule } from './shared/notification/notification.module';
import { MajorModule } from './modules/major/major.module';
import { ComboModule } from './modules/combo/combo.module';
import { CurriculumModule } from './modules/curriculum/curriculum.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    EventEmitterModule.forRoot(),
    ScheduleModule.forRoot(),
    CacheModule.registerAsync({
      useFactory: async (configService: ConfigService) => {
        return {
          stores: [createKeyv(configService.get<string>('REDIS_URL'))],
          ttl: 30 * 1000,
        };
      },
      inject: [ConfigService],
      isGlobal: true,
    }),
    MongooseModule.forRootAsync({
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URL'),
      }),
      inject: [ConfigService],
    }),
    StudentModule,
    SubjectModule,
    AuthModule,
    RedisModule,
    SystemUserModule,
    SemesterModule,
    CourseModule,
    AttendanceModule,
    SessionModule,
    EnrollmentModule,
    AiModule,
    FirebaseModule,
    AlertModule,
    QueueModule,
    NotificationModule,
    MajorModule,
    ComboModule,
    CurriculumModule,
  ],
  controllers: [],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: HttpCacheInterceptor,
    },
  ],
})
export class AppModule {}
