// src/components/blog/AdminBlogManagement.jsx
import React from 'react';
import BlogListPage from './BlogListPage'; // Reuse the list logic

const AdminBlogManagement = ({ navigateTo }) => {
    
    // In a full application, this component would handle deleting/editing posts.
    // For now, it provides the Admin view and the button to create a new post.

    return (
        <div className="container py-4">
            <h2 className="mb-4 text-center">Admin Blog Management 📝</h2>
            
            <div className="d-flex justify-content-between align-items-center mb-4">
                <p className="mb-0 text-muted">View all internally-created and auto-ingested posts.</p>
                <button 
                    className="btn btn-success" 
                    onClick={() => navigateTo('admin-create-post')}
                >
                    <i className="fas fa-plus-circle me-2"></i> Create New Post
                </button>
            </div>

            {/* Reuse the Blog List Component to show all posts */}
            <BlogListPage navigateTo={navigateTo} isAdminView={true} /> 
            
            {/* Note: You would modify BlogListPage to show "Edit/Delete" buttons 
               inside PostCard if isAdminView is true. */}
        </div>
    );
};

export default AdminBlogManagement;