// Initialize form
document.addEventListener('DOMContentLoaded', function() {
    initializeForm();
});

function initializeForm() {
    // Handle employee ID input - only digits, max 9
    const employeeIdInput = document.getElementById('employeeIdPartB');
    if (employeeIdInput) {
        employeeIdInput.addEventListener('input', function() {
            // Remove any non-digit characters
            this.value = this.value.replace(/\D/g, '');
            
            // Limit to 9 digits
            if (this.value.length > 9) {
                this.value = this.value.substring(0, 9);
            }
            
            // Validate and show error
            const errorMessage = this.parentElement.querySelector('.error-message');
            if (this.value.length > 0 && this.value.length !== 9) {
                this.classList.add('error');
                if (errorMessage) {
                    errorMessage.style.display = 'block';
                }
            } else {
                this.classList.remove('error');
                if (errorMessage) {
                    errorMessage.style.display = 'none';
                }
            }
        });
        
        employeeIdInput.addEventListener('blur', function() {
            const errorMessage = this.parentElement.querySelector('.error-message');
            if (this.value.length > 0 && this.value.length !== 9) {
                this.classList.add('error');
                if (errorMessage) {
                    errorMessage.style.display = 'block';
                }
            } else {
                this.classList.remove('error');
                if (errorMessage) {
                    errorMessage.style.display = 'none';
                }
            }
        });
    }
    
    // Handle severance amount checkbox
    const designateSeveranceCheckbox = document.getElementById('designateSeveranceAmount');
    const severanceAmountDetails = document.getElementById('severanceAmountDetails');
    
    if (designateSeveranceCheckbox && severanceAmountDetails) {
        designateSeveranceCheckbox.addEventListener('change', function() {
            if (this.checked) {
                severanceAmountDetails.style.display = 'block';
            } else {
                severanceAmountDetails.style.display = 'none';
            }
        });
    }

    // Handle pension fund deduction file number - auto-add 9 prefix
    const pensionFundDeductionFileInput = document.getElementById('pensionFundDeductionFile');
    if (pensionFundDeductionFileInput) {
        pensionFundDeductionFileInput.addEventListener('focus', function() {
            let value = this.value.replace(/\D/g, '');
            if (!value.startsWith('9')) {
                value = '9' + value.replace(/^9+/, '');
            }
            this.value = value;
            setTimeout(() => {
                if (this.value.startsWith('9')) {
                    this.setSelectionRange(1, 1);
                } else {
                    this.setSelectionRange(0, 0);
                }
            }, 0);
        });
        
        pensionFundDeductionFileInput.addEventListener('input', function() {
            let value = this.value.replace(/\D/g, '');
            if (!value.startsWith('9')) {
                value = '9' + value.replace(/^9+/, '');
            }
            if (value.length > 9) {
                value = value.substring(0, 9);
            }
            this.value = value;
        });
    }
    
    // Form validation and PDF generation
    const form = document.getElementById('form161PartB');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            if (validateForm()) {
                generatePDF();
            }
        });
    }
}

// Add row for employee request
function addEmployeeRequestRow(rowNumber, payerName, totalAmount) {
    const tbody = document.getElementById('employeeRequestsBody');
    const row = document.createElement('tr');
    row.id = `employeeRequest_${rowNumber}`;
    row.innerHTML = `
        <td>${rowNumber}</td>
        <td>${payerName || ''}</td>
        <td>${totalAmount || ''}</td>
        <td>
            <input type="number" name="pensionContinuity_${rowNumber}" 
                   min="0" form="form161PartB" style="width: 100%; border: 1px solid #ddd; padding: 8px; border-radius: 4px;">
        </td>
        <td>
            <input type="number" name="severanceContinuity_${rowNumber}" 
                   min="0" form="form161PartB" style="width: 100%; border: 1px solid #ddd; padding: 8px; border-radius: 4px;">
        </td>
        <td>
            <input type="number" name="exemptAmount_${rowNumber}" 
                   min="0" form="form161PartB" style="width: 100%; border: 1px solid #ddd; padding: 8px; border-radius: 4px;">
        </td>
        <td>
            <input type="number" name="taxableAmount_${rowNumber}" 
                   min="0" form="form161PartB" style="width: 100%; border: 1px solid #ddd; padding: 8px; border-radius: 4px;">
        </td>
    `;
    tbody.appendChild(row);
}

// Validate form
function validateForm() {
    const form = document.getElementById('form161PartB');
    const employeeId = document.getElementById('employeeIdPartB').value;
    const deliveryDate = document.getElementById('partADeliveryDate').value;
    
    if (!employeeId || employeeId.length !== 9) {
        showAppAlert('יש להזין מספר זהות תקין (9 ספרות)');
        return false;
    }
    
    if (!deliveryDate) {
        showAppAlert('יש להזין תאריך מסירת חלק א\' לעובד');
        return false;
    }
    
    return true;
}

// Calculate totals
function calculateTotals() {
    const rows = document.querySelectorAll('#employeeRequestsBody tr');
    let totalGrant = 0;
    let totalPension = 0;
    let totalSeverance = 0;
    let totalExempt = 0;
    let totalTaxable = 0;
    
    rows.forEach(row => {
        const totalAmount = parseFloat(row.querySelector('td:nth-child(3)').textContent) || 0;
        const pensionContinuity = parseFloat(row.querySelector('input[name^="pensionContinuity"]')?.value) || 0;
        const severanceContinuity = parseFloat(row.querySelector('input[name^="severanceContinuity"]')?.value) || 0;
        const exemptAmount = parseFloat(row.querySelector('input[name^="exemptAmount"]')?.value) || 0;
        const taxableAmount = parseFloat(row.querySelector('input[name^="taxableAmount"]')?.value) || 0;
        
        totalGrant += totalAmount;
        totalPension += pensionContinuity;
        totalSeverance += severanceContinuity;
        totalExempt += exemptAmount;
        totalTaxable += taxableAmount;
    });
    
    // Update total row
    document.getElementById('totalGrantAmount').value = totalGrant;
    document.getElementById('totalPensionContinuity').value = totalPension;
    document.getElementById('totalSeveranceContinuity').value = totalSeverance;
    document.getElementById('totalExemptAmount').value = totalExempt;
    document.getElementById('totalTaxableAmount').value = totalTaxable;
}

// Digital Signature functionality
function initSignatureCanvas() {
    const canvas = document.getElementById('signatureCanvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const clearBtn = document.getElementById('clearSignature');
    const signatureInput = document.getElementById('employeeSignature');
    
    let isDrawing = false;
    let lastX = 0;
    let lastY = 0;
    
    // Set canvas style
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    function getEventPos(e) {
        const rect = canvas.getBoundingClientRect();
        if (e.touches && e.touches.length > 0) {
            return {
                x: e.touches[0].clientX - rect.left,
                y: e.touches[0].clientY - rect.top
            };
        }
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    }
    
    function startDrawing(e) {
        isDrawing = true;
        const pos = getEventPos(e);
        lastX = pos.x;
        lastY = pos.y;
        e.preventDefault();
    }
    
    function draw(e) {
        if (!isDrawing) return;
        e.preventDefault();
        
        const pos = getEventPos(e);
        ctx.beginPath();
        ctx.moveTo(lastX, lastY);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
        
        lastX = pos.x;
        lastY = pos.y;
        
        // Save signature to hidden input
        signatureInput.value = canvas.toDataURL('image/png');
    }
    
    function stopDrawing() {
        if (isDrawing) {
            isDrawing = false;
            signatureInput.value = canvas.toDataURL('image/png');
        }
    }
    
    // Mouse events
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseout', stopDrawing);
    
    // Touch events
    canvas.addEventListener('touchstart', startDrawing);
    canvas.addEventListener('touchmove', draw);
    canvas.addEventListener('touchend', stopDrawing);
    canvas.addEventListener('touchcancel', stopDrawing);
    
    // Clear button
    if (clearBtn) {
        clearBtn.addEventListener('click', function() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            signatureInput.value = '';
        });
    }
}

// Generate PDF from form
function generatePDF() {
    if (typeof html2pdf === 'undefined') {
        showAppAlert('ספריית יצירת PDF אינה זמינה כרגע');
        return;
    }
    // Show loading message
    const originalButton = document.querySelector('button[type="submit"]');
    const originalText = originalButton.textContent;
    originalButton.textContent = 'מייצר PDF...';
    originalButton.disabled = true;
    
    // Get the form container
    const formContainer = document.querySelector('.container');
    
    // Configure PDF options
    const options = {
        margin: [10, 10, 10, 10],
        filename: 'טופס_161_חלק_ב_' + new Date().getTime() + '.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
            scale: 2,
            useCORS: true,
            logging: false,
            letterRendering: true
        },
        jsPDF: { 
            unit: 'mm', 
            format: 'a4', 
            orientation: 'portrait',
            compress: true
        }
    };
    
    // Generate PDF
    html2pdf().set(options).from(formContainer).save().then(function() {
        originalButton.textContent = originalText;
        originalButton.disabled = false;
        showAppAlert('קובץ PDF נוצר בהצלחה!');
    }).catch(function(error) {
        console.error('Error generating PDF:', error);
        originalButton.textContent = originalText;
        originalButton.disabled = false;
        showAppAlert('שגיאה ביצירת PDF. נסה שוב.');
    });
}

// הגדלת ה-calendar popup בלבד (רק הלוח שנפתח, לא התיבה ולא הדף)
function setupCalendarPopupZoom() {
    const dateInputs = document.querySelectorAll('input[type="date"]');
    
    dateInputs.forEach(input => {
        // משתמש ב-MutationObserver כדי לזהות את ה-calendar popup כשהוא נפתח
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                mutation.addedNodes.forEach(function(node) {
                    if (node.nodeType === 1) { // Element node
                        // מחפש את ה-calendar popup - בדפדפנים שונים יש מבנים שונים
                        let calendarPopup = null;
                        
                        // Chrome/Edge - מחפש div עם role="dialog" או element עם class שמכיל "calendar"
                        if (node.getAttribute && node.getAttribute('role') === 'dialog') {
                            calendarPopup = node;
                        } else if (node.classList) {
                            // מחפש class שמכיל calendar או datepicker
                            for (let className of node.classList) {
                                if (className.toLowerCase().includes('calendar') || 
                                    className.toLowerCase().includes('datepicker')) {
                                    calendarPopup = node;
                                    break;
                                }
                            }
                        }
                        
                        // אם מצאנו calendar popup, מגדילים אותו
                        if (calendarPopup) {
                            calendarPopup.style.zoom = '1.5';
                            calendarPopup.style.transform = 'scale(1.5)';
                            calendarPopup.style.transformOrigin = 'top right';
                        }
                        
                        // מחפש גם בתוך ה-node
                        const innerCalendar = node.querySelector && (
                            node.querySelector('[role="dialog"]') ||
                            node.querySelector('[class*="calendar"]') ||
                            node.querySelector('[class*="datepicker"]')
                        );
                        
                        if (innerCalendar) {
                            innerCalendar.style.zoom = '1.5';
                            innerCalendar.style.transform = 'scale(1.5)';
                            innerCalendar.style.transformOrigin = 'top right';
                        }
                    }
                });
            });
        });
        
        input.addEventListener('focus', function() {
            // מתחיל לצפות בשינויים ב-DOM כשה-calendar נפתח
            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
            
            // מפסיק את ה-observer אחרי 3 שניות (אחרי שה-calendar נסגר)
            setTimeout(() => {
                observer.disconnect();
            }, 3000);
        });
        
        input.addEventListener('blur', function() {
            // מפסיק את ה-observer כשה-calendar נסגר
            setTimeout(() => {
                observer.disconnect();
            }, 500);
        });
    });
}

// Add event listeners for auto-calculation
document.addEventListener('DOMContentLoaded', function() {
    // Initialize signature canvas
    initSignatureCanvas();
    
    // הגדלת ה-calendar popup בלבד
    setupCalendarPopupZoom();
    
    // Listen for changes in input fields to recalculate totals
    const tbody = document.getElementById('employeeRequestsBody');
    if (tbody) {
        tbody.addEventListener('input', function(e) {
            if (e.target.type === 'number') {
                calculateTotals();
            }
        });
    }
});

function showAppAlert(message, options = {}) {
    const config = {
        icon: options.icon || 'warning',
        title: options.title || 'הודעה',
        text: message,
        confirmButtonText: options.confirmButtonText || 'אישור',
        direction: 'rtl'
    };

    if (typeof Swal !== 'undefined' && Swal && typeof Swal.fire === 'function') {
        return Swal.fire(config);
    }

    window.alert(message);
    return Promise.resolve();
}


