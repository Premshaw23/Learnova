import React from 'react';
import { sanitizeHtml } from '../../utils/sanitizeHtml.js';

/**
 * CourseDetail Component
 * Renders course details and sanitizes rich-text course descriptions to prevent stored XSS attacks.
 */
export function CourseDetail({ course }) {
  if (!course) {
    return <div className="p-4 text-gray-500">No course data available.</div>;
  }

  const sanitizedDescription = sanitizeHtml(course.description || '');

  return (
    <div className="course-detail border rounded-lg p-6 bg-white shadow-sm">
      <h1 className="text-3xl font-bold mb-4">{course.title || 'Untitled Course'}</h1>
      {course.instructor && (
        <p className="text-sm text-gray-600 mb-4">
          Instructor: <span className="font-semibold">{course.instructor}</span>
        </p>
      )}
      <div className="course-description mt-6 border-t pt-4">
        <h2 className="text-xl font-semibold mb-2">About This Course</h2>
        <div
          className="rich-text-content prose max-w-none text-gray-800"
          dangerouslySetInnerHTML={{ __html: sanitizedDescription }}
        />
      </div>
    </div>
  );
}

export default CourseDetail;
