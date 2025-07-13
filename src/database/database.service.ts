import { Injectable, Inject } from '@nestjs/common';
import { Pool, PoolClient } from 'pg';

@Injectable()
export class DatabaseService {
  constructor(
    @Inject('DATABASE_POOL')
    private pool: Pool,
  ) {}

  /**
   * Get a database client from the pool
   */
  async getClient(): Promise<PoolClient> {
    return this.pool.connect();
  }

  /**
   * Execute a query with the pool
   */
  async query(text: string, params?: any[]): Promise<any> {
    return this.pool.query(text, params);
  }

  /**
   * Execute a transaction
   */
  async transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Check if the database connection is healthy
   */
  async healthCheck(): Promise<boolean> {
    try {
      const result = await this.pool.query('SELECT 1');
      return result.rows.length > 0;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get database statistics
   */
  async getStats(): Promise<any> {
    const queries = [
      "SELECT COUNT(*) as colleges FROM colleges",
      "SELECT COUNT(*) as students FROM students", 
      "SELECT COUNT(*) as courses FROM courses",
      "SELECT COUNT(*) as timetables FROM timetables",
      "SELECT COUNT(*) as enrollments FROM student_course_selections",
    ];

    const results = await Promise.all(
      queries.map(query => this.pool.query(query))
    );

    return {
      colleges: parseInt(results[0].rows[0].colleges),
      students: parseInt(results[1].rows[0].students),
      courses: parseInt(results[2].rows[0].courses),
      timetables: parseInt(results[3].rows[0].timetables),
      enrollments: parseInt(results[4].rows[0].enrollments),
    };
  }

  /**
   * Close all connections in the pool
   */
  async close(): Promise<void> {
    await this.pool.end();
  }
}
