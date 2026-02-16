document.addEventListener('DOMContentLoaded', function() {
    const tableBody = document.getElementById('tableBody');
    const refreshBtn = document.getElementById('refreshBtn');
    const searchInput = document.getElementById('searchInput');
    const exportBtn = document.getElementById('exportBtn');
    
    let allSubmissions = [];
    let allUsers = [];
    
    // Load data
    loadData();
    
    // Event listeners
    refreshBtn.addEventListener('click', loadData);
    searchInput.addEventListener('input', filterData);
    exportBtn.addEventListener('click', exportToCSV);
    
    function loadData() {
        // Load submissions
        submissionsRef.once('value', function(snapshot) {
            const submissions = [];
            snapshot.forEach(function(childSnapshot) {
                submissions.push({
                    id: childSnapshot.key,
                    ...childSnapshot.val()
                });
            });
            allSubmissions = submissions;
            
            // Load users for referral counts
            usersRef.once('value', function(userSnapshot) {
                const users = [];
                userSnapshot.forEach(function(childSnapshot) {
                    users.push({
                        id: childSnapshot.key,
                        ...childSnapshot.val()
                    });
                });
                allUsers = users;
                
                updateStats();
                renderTable();
            });
        });
    }
    
    function updateStats() {
        const totalUsers = allUsers.length;
        const totalSubmissions = allSubmissions.length;
        const totalReferrals = allUsers.reduce((sum, user) => sum + (user.referrals || 0), 0);
        const completedUsers = allUsers.filter(user => user.submitted).length;
        
        const statsGrid = document.getElementById('statsGrid');
        statsGrid.innerHTML = `
            <div class="stat-card">
                <i class="fas fa-users"></i>
                <div class="stat-number">${totalUsers}</div>
                <div class="stat-label">Total Users</div>
            </div>
            <div class="stat-card">
                <i class="fas fa-gift"></i>
                <div class="stat-number">${totalSubmissions}</div>
                <div class="stat-label">Gifts Claimed</div>
            </div>
            <div class="stat-card">
                <i class="fas fa-share-alt"></i>
                <div class="stat-number">${totalReferrals}</div>
                <div class="stat-label">Total Referrals</div>
            </div>
            <div class="stat-card">
                <i class="fas fa-check-circle"></i>
                <div class="stat-number">${completedUsers}</div>
                <div class="stat-label">Completed</div>
            </div>
        `;
    }
    
    function renderTable() {
        const searchTerm = searchInput.value.toLowerCase();
        
        const filteredSubmissions = allSubmissions.filter(sub => {
            const userName = (sub.userName || '').toLowerCase();
            const mobile = (sub.mobileNumber || '').toLowerCase();
            return userName.includes(searchTerm) || mobile.includes(searchTerm);
        });
        
        if (filteredSubmissions.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No submissions found</td></tr>';
            return;
        }
        
        let html = '';
        filteredSubmissions.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
        
        filteredSubmissions.forEach(sub => {
            const user = allUsers.find(u => u.id === sub.userId) || {};
            const referrals = user.referrals || 0;
            const date = new Date(sub.submittedAt).toLocaleString();
            
            html += `
                <tr>
                    <td>${date}</td>
                    <td>${sub.userName || ''}</td>
                    <td>${sub.mobileNumber || ''}</td>
                    <td>${sub.city || ''}</td>
                    <td>${referrals}</td>
                    <td>
                        <span style="color: #28a745;">
                            <i class="fas fa-check-circle"></i> Completed
                        </span>
                    </td>
                </tr>
            `;
        });
        
        tableBody.innerHTML = html;
    }
    
    function filterData() {
        renderTable();
    }
    
    function exportToCSV() {
        // Prepare CSV data
        const headers = ['Date', 'Name', 'Mobile', 'City', 'Referrals', 'Status'];
        const rows = [];
        
        allSubmissions.forEach(sub => {
            const user = allUsers.find(u => u.id === sub.userId) || {};
            const date = new Date(sub.submittedAt).toLocaleString();
            rows.push([
                date,
                sub.userName || '',
                sub.mobileNumber || '',
                sub.city || '',
                user.referrals || 0,
                'Completed'
            ]);
        });
        
        // Create CSV content
        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');
        
        // Download CSV
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ramzan-gift-submissions-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    }
});