const API_BASE_URL = 'http://localhost:8000';

export const courseService = {
    async getCourses() {
        const response = await fetch(`${API_BASE_URL}/courses/`);
        if (!response.ok) throw new Error('Failed to fetch courses');
        return response.json();
    },

    async createCourse(course) {
        const courseData = {
            name: course.name,
            holes: course.holes.map(hole => ({
                number: hole.number,
                par: hole.par,
                handicap: hole.handicap
            }))
        };

        const response = await fetch(`${API_BASE_URL}/courses/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(courseData)
        });
        if (!response.ok) throw new Error('Failed to create course');
        return response.json();
    },

    async updateCourse(courseId, course) {
        const response = await fetch(`${API_BASE_URL}/courses/${courseId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(course)
        });
        if (!response.ok) throw new Error('Failed to update course');
        return response.json();
    },

    async deleteCourse(courseId) {
        const response = await fetch(`${API_BASE_URL}/courses/${courseId}`, {
            method: 'DELETE'
        });
        if (!response.ok) throw new Error('Failed to delete course');
        return response.json();
    }
};