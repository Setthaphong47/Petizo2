// Footer Component Loader
(function() {
    // Load footer component into page
    function loadFooter() {
        // Check if footer already exists
        if (document.querySelector('.site-footer')) {
            return;
        }

        // Create footer placeholder
        const footerPlaceholder = document.createElement('div');
        footerPlaceholder.id = 'footer-placeholder';
        document.body.appendChild(footerPlaceholder);

        // Fetch and insert footer
        fetch('/components/footer.html')
            .then(response => response.text())
            .then(html => {
                footerPlaceholder.innerHTML = html;
            })
            .catch(error => {
                console.error('Error loading footer:', error);
            });
    }

    // Load footer when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadFooter);
    } else {
        loadFooter();
    }
})();
