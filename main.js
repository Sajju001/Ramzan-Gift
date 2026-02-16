// Main Application Logic
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Ramzan Gift App Started');
    
    // DOM Elements
    const landingSection = document.getElementById('landingSection');
    const progressSection = document.getElementById('progressSection');
    const formSection = document.getElementById('formSection');
    const successSection = document.getElementById('successSection');
    
    const userNameInput = document.getElementById('userName');
    const getGiftBtn = document.getElementById('getGiftBtn');
    const displayName = document.getElementById('displayName');
    const progressBar = document.getElementById('progressBar');
    const progressPercentage = document.getElementById('progressPercentage');
    const referralCount = document.getElementById('referralCount');
    const referralLink = document.getElementById('referralLink');
    const copyLinkBtn = document.getElementById('copyLinkBtn');
    const whatsappShareBtn = document.getElementById('whatsappShareBtn');
    const giftForm = document.getElementById('giftForm');
    const homeBtn = document.getElementById('homeBtn');
    
    // State
    let currentUser = null;
    let currentReferrals = 0;
    const requiredReferrals = 15;
    const progressPerReferral = 100 / requiredReferrals;
    
    // Check Firebase connection
    if (!firebase.apps.length) {
        showMessage('Firebase not initialized!', 'error');
        console.error('Firebase not initialized');
        return;
    }
    
    // Check for referral parameter on load
    checkForReferral();
    
    // Event Listeners
    getGiftBtn.addEventListener('click', handleGetGift);
    copyLinkBtn.addEventListener('click', copyReferralLink);
    whatsappShareBtn.addEventListener('click', shareOnWhatsApp);
    giftForm.addEventListener('submit', handleFormSubmit);
    homeBtn.addEventListener('click', resetToHome);
    
    // Functions
    function handleGetGift() {
        const name = userNameInput.value.trim();
        if (!name) {
            showMessage('Please enter your name', 'error');
            return;
        }
        
        // Show loading state
        getGiftBtn.disabled = true;
        getGiftBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
        
        // Create user ID
        const userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        
        currentUser = {
            id: userId,
            name: name,
            referrals: 0,
            createdAt: new Date().toISOString(),
            userAgent: navigator.userAgent
        };
        
        console.log('Creating user:', currentUser);
        
        // Save to Firebase
        usersRef.child(userId).set(currentUser)
            .then(() => {
                console.log('✅ User saved successfully');
                
                displayName.textContent = name;
                updateProgressBar(0);
                
                // Generate referral link
                const link = `${window.location.origin}${window.location.pathname}?ref=${encodeURIComponent(userId)}`;
                referralLink.value = link;
                
                // Show progress section
                landingSection.classList.remove('active');
                progressSection.classList.add('active');
                
                // Start listening for referral updates
                listenForReferrals(userId);
                
                showMessage('Welcome ' + name + '! Share your link with 15 friends.', 'success');
            })
            .catch(error => {
                console.error('❌ Error saving user:', error);
                showMessage('Error: ' + error.message, 'error');
            })
            .finally(() => {
                getGiftBtn.disabled = false;
                getGiftBtn.innerHTML = '<i class="fas fa-gift"></i> Get Your Ramadan Gift';
            });
    }
    
    function checkForReferral() {
        const urlParams = new URLSearchParams(window.location.search);
        const refId = urlParams.get('ref');
        
        if (refId) {
            console.log('Referral detected from:', refId);
            
            // Check if refId exists in database
            usersRef.child(refId).once('value')
                .then((snapshot) => {
                    if (snapshot.exists()) {
                        // Record this referral
                        recordReferral(refId);
                        
                        // Show message on landing page
                        showMessage('Welcome! You came through a referral link.', 'success');
                    } else {
                        console.log('Invalid referral ID');
                    }
                })
                .catch(error => {
                    console.error('Error checking referral:', error);
                });
        }
    }
    
    function recordReferral(refId) {
        const referralData = {
            referrerId: refId,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            referralSource: window.location.href
        };
        
        console.log('Recording referral:', referralData);
        
        // Save referral
        referralsRef.push(referralData)
            .then((ref) => {
                console.log('✅ Referral recorded with ID:', ref.key);
                
                // Update referrer's count
                return usersRef.child(refId).child('referrals').transaction(
                    function(currentCount) {
                        return (currentCount || 0) + 1;
                    }
                );
            })
            .then(() => {
                console.log('✅ Referrer count updated');
            })
            .catch(error => {
                console.error('❌ Error recording referral:', error);
            });
    }
    
    function listenForReferrals(userId) {
        console.log('Listening for referrals for:', userId);
        
        usersRef.child(userId).on('value', function(snapshot) {
            const userData = snapshot.val();
            if (userData) {
                currentReferrals = userData.referrals || 0;
                console.log('Referral count updated:', currentReferrals);
                updateProgressBar(currentReferrals);
                
                // Check if progress reached 100%
                if (currentReferrals >= requiredReferrals) {
                    console.log('🎉 Target reached! Unlocking form...');
                    
                    // Unlock form
                    progressSection.classList.remove('active');
                    formSection.classList.add('active');
                    
                    // Stop listening
                    usersRef.child(userId).off();
                    
                    showMessage('Congratulations! You unlocked your gift!', 'success');
                }
            }
        }, function(error) {
            console.error('Error listening for referrals:', error);
        });
    }
    
    function updateProgressBar(count) {
        const percentage = Math.min((count / requiredReferrals) * 100, 100);
        progressBar.style.width = percentage + '%';
        progressPercentage.textContent = Math.round(percentage) + '%';
        referralCount.textContent = `${count}/${requiredReferrals} referrals`;
        
        // Add color effect based on progress
        if (percentage >= 100) {
            progressBar.style.background = 'linear-gradient(90deg, #4CAF50, #8BC34A)';
        } else if (percentage >= 50) {
            progressBar.style.background = 'linear-gradient(90deg, #FFC107, #FF9800)';
        }
    }
    
    function copyReferralLink() {
        referralLink.select();
        referralLink.setSelectionRange(0, 99999); // For mobile devices
        
        try {
            const successful = document.execCommand('copy');
            if (successful) {
                showMessage('✅ Link copied to clipboard!', 'success');
            } else {
                showMessage('❌ Copy failed. Please copy manually.', 'error');
            }
        } catch (err) {
            showMessage('❌ Copy failed. Please copy manually.', 'error');
        }
    }
    
    function shareOnWhatsApp() {
        const text = encodeURIComponent(
            `🌙 *Ramadan Mubarak!* 🎁\n\n` +
            `I'm inviting you to get your *Ramadan Gift*! 🎉\n\n` +
            `✨ Join using my referral link:\n` +
            `${referralLink.value}\n\n` +
            `🤲 May Allah bless you with happiness and prosperity this Ramadan!\n\n` +
            `#Ramadan #RamzanGift #RamadanMubarak`
        );
        
        window.open(`https://wa.me/?text=${text}`, '_blank');
    }
    
    function handleFormSubmit(e) {
        e.preventDefault();
        
        const mobileNumber = document.getElementById('mobileNumber').value.trim();
        const city = document.getElementById('city').value.trim();
        const termsChecked = document.getElementById('termsCheckbox').checked;
        
        // Validate mobile number (Pakistan format)
        const mobileRegex = /^(\+92|0|92)?[0-9]{10}$/;
        if (!mobileRegex.test(mobileNumber.replace(/\s/g, ''))) {
            showMessage('Please enter a valid mobile number', 'error');
            return;
        }
        
        if (!city) {
            showMessage('Please enter your city', 'error');
            return;
        }
        
        if (!termsChecked) {
            showMessage('Please accept the terms and conditions', 'error');
            return;
        }
        
        // Show loading state
        const submitBtn = document.getElementById('claimGiftBtn');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
        
        // Clean mobile number
        const cleanMobile = mobileNumber.replace(/\s/g, '');
        
        // Save submission
        const submission = {
            userId: currentUser.id,
            userName: currentUser.name,
            mobileNumber: cleanMobile,
            city: city,
            submittedAt: new Date().toISOString(),
            ipAddress: 'captured_by_server' // You can add IP capture if needed
        };
        
        console.log('Submitting form:', submission);
        
        submissionsRef.push(submission)
            .then((ref) => {
                console.log('✅ Submission saved with ID:', ref.key);
                
                // Update user with submission info
                return usersRef.child(currentUser.id).update({
                    submitted: true,
                    submissionId: ref.key,
                    mobileNumber: cleanMobile,
                    city: city
                });
            })
            .then(() => {
                formSection.classList.remove('active');
                successSection.classList.add('active');
                
                // Clear form
                document.getElementById('mobileNumber').value = '';
                document.getElementById('city').value = '';
                document.getElementById('termsCheckbox').checked = false;
                
                showMessage('🎁 Gift claimed successfully!', 'success');
            })
            .catch(error => {
                console.error('❌ Error saving submission:', error);
                showMessage('Error: ' + error.message, 'error');
            })
            .finally(() => {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fas fa-gift"></i> Claim My Gift';
            });
    }
    
    function resetToHome() {
        // Clear inputs
        userNameInput.value = '';
        
        // Show landing section
        successSection.classList.remove('active');
        formSection.classList.remove('active');
        progressSection.classList.remove('active');
        landingSection.classList.add('active');
        
        // Reset current user
        if (currentUser) {
            // Stop listening for referrals
            usersRef.child(currentUser.id).off();
        }
        currentUser = null;
    }
    
    function showMessage(text, type) {
        // Remove existing tooltips
        const existingTooltips = document.querySelectorAll('.tooltip');
        existingTooltips.forEach(t => t.remove());
        
        // Create tooltip
        const tooltip = document.createElement('div');
        tooltip.className = 'tooltip';
        tooltip.textContent = text;
        
        // Set color based on type
        if (type === 'error') {
            tooltip.style.background = '#dc3545';
        } else if (type === 'success') {
            tooltip.style.background = '#28a745';
        } else {
            tooltip.style.background = '#1a3f2c';
        }
        
        document.body.appendChild(tooltip);
        
        // Position tooltip
        tooltip.style.position = 'fixed';
        tooltip.style.left = '50%';
        tooltip.style.top = '20px';
        tooltip.style.transform = 'translateX(-50%)';
        tooltip.style.padding = '12px 24px';
        tooltip.style.borderRadius = '50px';
        tooltip.style.color = 'white';
        tooltip.style.fontWeight = 'bold';
        tooltip.style.zIndex = '9999';
        tooltip.style.boxShadow = '0 4px 15px rgba(0,0,0,0.2)';
        tooltip.style.animation = 'slideDown 0.3s ease';
        
        // Remove after 3 seconds
        setTimeout(() => {
            tooltip.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => {
                tooltip.remove();
            }, 300);
        }, 3000);
    }
});

// Add animations to CSS dynamically
const style = document.createElement('style');
style.textContent = `
    @keyframes slideDown {
        from { transform: translate(-50%, -100px); opacity: 0; }
        to { transform: translate(-50%, 0); opacity: 1; }
    }
    
    @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
    }
`;
document.head.appendChild(style);