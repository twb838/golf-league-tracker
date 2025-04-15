import React, { useState, useEffect } from 'react';
import { courseService } from '../services/courseService';
import './Courses.css';

function Courses() {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [editingCourse, setEditingCourse] = useState(null);
    const [newCourse, setNewCourse] = useState({
        name: '',
        holes: Array(18).fill().map((_, index) => ({
            number: index + 1,
            par: 4,           // Default par value
            handicap: 1       // Default handicap value
        }))
    });
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [courseToDelete, setCourseToDelete] = useState(null);
    const [showCreateForm, setShowCreateForm] = useState(false);

    useEffect(() => {
        fetchCourses();
    }, []);

    const fetchCourses = async () => {
        try {
            setLoading(true);
            const data = await courseService.getCourses();
            setCourses(data);
        } catch (err) {
            setError('Failed to load courses');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        if (editingCourse) {
            setEditingCourse(prev => ({
                ...prev,
                [name]: value
            }));
        } else {
            setNewCourse(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    const handleHoleChange = (holeIndex, field, value) => {
        const updateHoles = (prev) => ({
            ...prev,
            holes: prev.holes.map((hole, index) => 
                index === holeIndex 
                    ? { ...hole, [field]: value === '' ? '' : parseInt(value, 10) }
                    : hole
            )
        });

        if (editingCourse) {
            setEditingCourse(updateHoles);
        } else {
            setNewCourse(updateHoles);
        }
    };

    const getValidHoles = (holes) => {
        // Check if holes exists and is an array
        if (!holes || !Array.isArray(holes)) {
            return [];
        }

        return holes
            .filter(hole => hole.par !== '')
            .map((hole, index) => ({
                id: hole.id, // Preserve existing hole ID
                number: index + 1,
                par: hole.par,
                handicap: hole.handicap || 0
            }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        try {
            setLoading(true);
            const courseToUpdate = editingCourse || newCourse;
            const validHoles = getValidHoles(courseToUpdate.holes);
            
            if (validHoles.length === 0) {
                setError('Please fill in at least one hole');
                return;
            }

            const courseData = {
                name: courseToUpdate.name,
                holes: validHoles.map((hole) => ({
                    id: hole.id, // Include the hole ID if it exists
                    number: hole.number,
                    par: parseInt(hole.par),
                    handicap: parseInt(hole.handicap || 1)
                }))
            };

            if (editingCourse) {
                await courseService.updateCourse(editingCourse.id, courseData);
                setSuccessMessage('Course updated successfully');
            } else {
                await courseService.createCourse(courseData);
                setSuccessMessage('Course created successfully');
                resetForm();
            }
            
            setShowSuccessModal(true);
            setTimeout(() => setShowSuccessModal(false), 3000);
            fetchCourses();
        } catch (err) {
            setError(err.message);
            setTimeout(() => setError(null), 3000);
        } finally {
            setLoading(false);
            setEditingCourse(null);
        }
    };

    const deleteCourse = async (courseId) => {
        if (!window.confirm('Are you sure you want to delete this course?')) return;
        try {
            setLoading(true);
            await courseService.deleteCourse(courseId);
            setCourses(prev => prev.filter(course => course.id !== courseId));
            setSuccessMessage('Course deleted successfully');
            setShowSuccessModal(true);
            setTimeout(() => setShowSuccessModal(false), 3000);
        } catch (err) {
            setError(err.message);
            setTimeout(() => setError(null), 3000);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteClick = (course) => {
        setCourseToDelete(course);
        setShowDeleteModal(true);
    };

    const handleDeleteConfirm = async () => {
        try {
            setLoading(true);
            await courseService.deleteCourse(courseToDelete.id);
            setCourses(prev => prev.filter(course => course.id !== courseToDelete.id));
            setSuccessMessage('Course deleted successfully');
            setShowSuccessModal(true);
            setTimeout(() => setShowSuccessModal(false), 3000);
        } catch (err) {
            setError(err.message);
            setTimeout(() => setError(null), 3000);
        } finally {
            setLoading(false);
            setShowDeleteModal(false);
            setCourseToDelete(null);
        }
    };

    const handleDeleteCancel = () => {
        setShowDeleteModal(false);
        setCourseToDelete(null);
    };

    const resetForm = () => {
        setNewCourse({
            name: '',
            holes: Array(18).fill().map((_, index) => ({
                number: index + 1,
                par: 4,
                handicap: 1
            }))
        });
    };

    const handleCancelEdit = () => {
        setEditingCourse(null);
        resetForm();
    };

    const handleEdit = (course) => {
        // Map existing holes and preserve IDs for existing holes
        const holes = Array(18).fill().map((_, index) => {
            const existingHole = course.holes.find(h => h.number === index + 1);
            if (!existingHole) {
                return {
                    number: index + 1,
                    par: '',
                    handicap: ''
                };
            }
            return {
                id: existingHole.id,    // Preserve the hole ID
                number: index + 1,
                par: existingHole.par || '',
                handicap: existingHole.handicap || ''
            };
        });

        setEditingCourse({
            ...course,
            holes
        });
        setShowCreateForm(true);
    };

    return (
        <div className="courses-container">
            <div className="courses-header">
                <h2>Golf Courses</h2>
                <button 
                    onClick={() => setShowCreateForm(!showCreateForm)}
                    className="add-course-button"
                >
                    {showCreateForm ? 'Hide Form' : 'Add New Course'}
                </button>
            </div>

            {error && <div className="error-message">{error}</div>}
            {showSuccessModal && (
                <div className="success-modal">
                    <div className="success-modal-content">
                        <p>{successMessage}</p>
                    </div>
                </div>
            )}

            {loading ? (
                <div className="loading">Loading...</div>
            ) : (
                <div className="courses-list">
                    {courses.length > 0 ? (
                        <ul>
                            {courses.map(course => (
                                <li key={course.id} className="course-item">
                                    <span>
                                        {course.name} - {getValidHoles(course.holes).length} holes
                                    </span>
                                    <div className="button-group">
                                        <button
                                            onClick={() => handleEdit(course)}
                                            className="edit-button"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDeleteClick(course)}
                                            className="delete-button"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="no-courses">No courses available. Add a new course to get started!</p>
                    )}
                </div>
            )}

            {showCreateForm && (
                <form onSubmit={handleSubmit} className="course-form">
                    <div className="form-group">
                        <label>Course Name:</label>
                        <input
                            type="text"
                            name="name"
                            value={editingCourse ? editingCourse.name : newCourse.name}
                            onChange={handleInputChange}
                            required
                        />
                    </div>
                    
                    <div className="holes-container">
                        <div className="holes-grid front-nine">
                            <h4>Front Nine</h4>
                            <div className="holes-header">
                                <span>Hole</span>
                                <span>Par</span>
                                <span>Handicap</span>
                            </div>
                            {(editingCourse ? editingCourse.holes : newCourse.holes).slice(0, 9).map((hole, index) => (
                                <div key={index} className="hole-row">
                                    <span className="hole-number">{index + 1}</span>
                                    <input
                                        type="number"
                                        min="3"
                                        max="5"
                                        value={hole.par}
                                        onChange={(e) => handleHoleChange(index, 'par', e.target.value)}
                                    />
                                    <input
                                        type="number"
                                        min="1"
                                        max="18"
                                        value={hole.handicap}
                                        onChange={(e) => handleHoleChange(index, 'handicap', e.target.value)}
                                    />
                                </div>
                            ))}
                        </div>
                        <div className="holes-grid back-nine">
                            <h4>Back Nine</h4>
                            <div className="holes-header">
                                <span>Hole</span>
                                <span>Par</span>
                                <span>Handicap</span>
                            </div>
                            {(editingCourse ? editingCourse.holes : newCourse.holes).slice(9, 18).map((hole, index) => (
                                <div key={index + 9} className="hole-row">
                                    <span className="hole-number">{index + 10}</span>
                                    <input
                                        type="number"
                                        min="3"
                                        max="5"
                                        value={hole.par}
                                        onChange={(e) => handleHoleChange(index + 9, 'par', e.target.value)}
                                    />
                                    <input
                                        type="number"
                                        min="1"
                                        max="18"
                                        value={hole.handicap}
                                        onChange={(e) => handleHoleChange(index + 9, 'handicap', e.target.value)}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                    <button type="submit">
                        {editingCourse ? 'Update Course' : 'Add Course'}
                    </button>
                    {editingCourse && (
                        <button type="button" onClick={handleCancelEdit}>
                            Cancel Edit
                        </button>
                    )}
                </form>
            )}

            {showDeleteModal && (
                <div className="modal-overlay">
                    <div className="delete-modal">
                        <h3>Confirm Delete</h3>
                        <p>Are you sure you want to delete the course "{courseToDelete?.name}"?</p>
                        <div className="modal-buttons">
                            <button onClick={handleDeleteConfirm} className="confirm-delete-btn">
                                Delete
                            </button>
                            <button onClick={handleDeleteCancel} className="cancel-delete-btn">
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Courses;