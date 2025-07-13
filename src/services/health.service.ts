import { Injectable, Inject } from '@nestjs/common';
import { Pool } from 'pg';

@Injectable()
export class HealthService {
  constructor(
    @Inject('DATABASE_POOL')
    private pool: Pool,
  ) {}

  async checkHealth() {
    try {
      // Test database connection
      const result = await this.pool.query('SELECT NOW()');
      
      // Test basic data
      const collegesResult = await this.pool.query('SELECT COUNT(*) FROM colleges');
      const studentsResult = await this.pool.query('SELECT COUNT(*) FROM students');
      const coursesResult = await this.pool.query('SELECT COUNT(*) FROM courses');
      
      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        database: {
          connected: true,
          serverTime: result.rows[0].now,
        },
        data: {
          colleges: parseInt(collegesResult.rows[0].count),
          students: parseInt(studentsResult.rows[0].count),
          courses: parseInt(coursesResult.rows[0].count),
        },
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        database: {
          connected: false,
          error: error.message,
        },
      };
    }
  }
}
