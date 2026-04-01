'use server';

import { neon } from '@neondatabase/serverless';
import { auth } from '@clerk/nextjs/server';
import type { Course, GradeItem } from '@/lib/types';
import type { GpaScaleType, GradeRow } from '@/lib/gpa-scales';

const sql = neon(process.env.DATABASE_URL!, { fetchOptions: { cache: 'no-store' } });

export async function saveGpaScaleAction(scaleType: GpaScaleType, grades: GradeRow[]) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  await sql`
    INSERT INTO user_settings (user_id, gpa_scale_type, gpa_grades)
    VALUES (${userId}, ${scaleType}, ${JSON.stringify(grades)}::jsonb)
    ON CONFLICT (user_id) DO UPDATE 
    SET gpa_scale_type = EXCLUDED.gpa_scale_type,
        gpa_grades = EXCLUDED.gpa_grades;
  `;
}

export async function fetchGpaScaleAction(): Promise<{ scaleType: GpaScaleType, grades: GradeRow[] } | null> {
  const { userId } = await auth();
  if (!userId) return null;

  const result = await sql`SELECT gpa_scale_type, gpa_grades FROM user_settings WHERE user_id = ${userId}`;
  if (result.length === 0) return null;

  return {
    scaleType: result[0].gpa_scale_type as GpaScaleType,
    grades: result[0].gpa_grades as GradeRow[]
  };
}

export async function fetchCoursesAction(): Promise<Course[]> {
  const { userId } = await auth();
  console.log("fetchCoursesAction userId:", userId);
  if (!userId) return [];

  const courses = await sql`SELECT * FROM courses WHERE user_id = ${userId}`;
  console.log("fetchCoursesAction courses found:", courses.length);
  const items = courses.length > 0 
    ? await sql`SELECT * FROM grade_items WHERE course_id IN (SELECT id FROM courses WHERE user_id = ${userId})`
    : [];

  return courses.map((c) => {
    return {
      id: c.id,
      title: c.title,
      code: c.code,
      creditHours: c.credit_hours,
      status: c.status,
      finalPercent: c.final_percent,
      items: items.filter((i) => i.course_id === c.id).map((i) => ({
        id: i.id,
        kind: i.kind,
        name: i.name,
        score: i.score,
        weight: i.weight
      }))
    };
  });
}

export async function saveCourseAction(course: Course) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  await sql`
    INSERT INTO courses (id, user_id, title, code, credit_hours, status, final_percent)
    VALUES (${course.id}, ${userId}, ${course.title}, ${course.code}, ${course.creditHours}, ${course.status}, ${course.finalPercent})
    ON CONFLICT (id) DO UPDATE 
    SET title = EXCLUDED.title,
        code = EXCLUDED.code,
        credit_hours = EXCLUDED.credit_hours,
        status = EXCLUDED.status,
        final_percent = EXCLUDED.final_percent;
  `;

  // Upsert items (this approach deletes and recreates all items for simplicity to ensure sync)
  await sql`DELETE FROM grade_items WHERE course_id = ${course.id}`;

  if (course.items.length > 0) {
    for (const item of course.items) {
      await sql`
        INSERT INTO grade_items (id, course_id, kind, name, score, weight)
        VALUES (${item.id}, ${course.id}, ${item.kind}, ${item.name}, ${item.score}, ${item.weight})
      `;
    }
  }
}

export async function deleteCourseAction(courseId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  await sql`DELETE FROM courses WHERE id = ${courseId} AND user_id = ${userId}`;
}
