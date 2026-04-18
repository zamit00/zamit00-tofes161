// Initialize form
document.addEventListener('DOMContentLoaded', function() {
    initializeForm();
    initEmployerSignatureCanvas();
});

// Initialize form functionality
function initializeForm() {
    // Handle employee ID input - only digits, max 9
    const employeeIdInput = document.getElementById('employeeIdPartC');
    if (employeeIdInput) {
        employeeIdInput.addEventListener('input', function() {
            this.value = this.value.replace(/\D/g, ''); // Remove any non-digit characters
            if (this.value.length > 9) {
                this.value = this.value.substring(0, 9); // Limit to 9 digits
            }
            const errorMessage = this.parentElement.querySelector('.error-message');
            if (this.value.length > 0 && this.value.length !== 9) {
                this.classList.add('error');
                if (errorMessage) { errorMessage.style.display = 'block'; }
            } else {
                this.classList.remove('error');
                if (errorMessage) { errorMessage.style.display = 'none'; }
            }
        });
        
        employeeIdInput.addEventListener('blur', function() {
            if (this.value.length > 0 && this.value.length !== 9) {
                this.classList.add('error');
            } else {
                this.classList.remove('error');
            }
        });
    }

    // Ensure only one alternative can be selected (ג.1)
    const alternativeA = document.getElementById('alternativeA');
    const alternativeB = document.getElementById('alternativeB');
    const summaryTableSection = document.getElementById('summaryTableSection');
    
    if (alternativeA && alternativeB) {
        // הצג את הטבלה כברירת מחדל אם חלופה ב' מסומנת
        if (alternativeB.checked && summaryTableSection) {
            summaryTableSection.style.display = 'block';
        }
        
        alternativeA.addEventListener('change', function() {
            if (this.checked) {
                alternativeB.checked = false;
                // הסתר את הטבלה אם חלופה א' נבחרה
                if (summaryTableSection) {
                    summaryTableSection.style.display = 'none';
                }
            }
        });
        
        alternativeB.addEventListener('change', function() {
            if (this.checked) {
                alternativeA.checked = false;
                // הצג את הטבלה אם חלופה ב' נבחרה
                if (summaryTableSection) {
                    summaryTableSection.style.display = 'block';
                }
            } else {
                // הסתר את הטבלה אם חלופה ב' בוטלה
                if (summaryTableSection) {
                    summaryTableSection.style.display = 'none';
                }
            }
        });
    }

    // Ensure only one option can be selected in ג.2
    const option1 = document.getElementById('option1');
    const option2 = document.getElementById('option2');
    
    if (option1 && option2) {
        option1.addEventListener('change', function() {
            if (this.checked) {
                option2.checked = false;
            }
        });
        
        option2.addEventListener('change', function() {
            if (this.checked) {
                option1.checked = false;
            }
        });
    }

    // Enable/disable condition number inputs based on checkbox state
    const alternativeAConditionInput = document.getElementById('alternativeAConditionNumber');
    const alternativeBConditionInput = document.getElementById('alternativeBConditionNumber');
    
    if (option1 && alternativeAConditionInput) {
        option1.addEventListener('change', function() {
            alternativeAConditionInput.disabled = !this.checked;
        });
        alternativeAConditionInput.disabled = !option1.checked;
    }
    
    if (option2 && alternativeBConditionInput) {
        option2.addEventListener('change', function() {
            alternativeBConditionInput.disabled = !this.checked;
        });
        alternativeBConditionInput.disabled = !option2.checked;
    }

    // Auto-calculate totals in summary table
    setupSummaryTableCalculations();

    // Form validation
    const form = document.getElementById('form161PartC');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            if (validateForm()) {
                generatePDF();
            }
        });
    }
}

// Setup auto-calculation for summary table (לא נדרש יותר - רק שורה אחת)
function setupSummaryTableCalculations() {
    // אין צורך בחישובים - רק שורה אחת ללא סיכום
}

// Validate form
function validateForm() {
    const employeeId = document.getElementById('employeeIdPartC');
    if (employeeId && employeeId.value && employeeId.value.length !== 9) {
        showAppAlert('מספר זהות חייב להיות 9 ספרות');
        employeeId.focus();
        return false;
    }

    const alternativeA = document.getElementById('alternativeA');
    const alternativeB = document.getElementById('alternativeB');
    
    if (!alternativeA.checked && !alternativeB.checked) {
        showAppAlert('יש לבחור חלופה א\' או חלופה ב\'');
        return false;
    }

    return true;
}

// Initialize employer signature canvas
function initEmployerSignatureCanvas() {
    const canvas = document.getElementById('employerSignatureCanvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const clearBtn = document.getElementById('clearEmployerSignature');
    const signatureInput = document.getElementById('employerSignature');
    
    let isDrawing = false;
    let lastX = 0;
    let lastY = 0;
    
    // Set canvas style
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    function getCoordinates(e) {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        
        if (e.touches) {
            return {
                x: (e.touches[0].clientX - rect.left) * scaleX,
                y: (e.touches[0].clientY - rect.top) * scaleY
            };
        } else {
            return {
                x: (e.clientX - rect.left) * scaleX,
                y: (e.clientY - rect.top) * scaleY
            };
        }
    }
    
    function startDrawing(e) {
        isDrawing = true;
        const coords = getCoordinates(e);
        lastX = coords.x;
        lastY = coords.y;
    }
    
    function draw(e) {
        if (!isDrawing) return;
        e.preventDefault();
        
        const coords = getCoordinates(e);
        
        ctx.beginPath();
        ctx.moveTo(lastX, lastY);
        ctx.lineTo(coords.x, coords.y);
        ctx.stroke();
        
        lastX = coords.x;
        lastY = coords.y;
        
        // Save signature
        signatureInput.value = canvas.toDataURL();
    }
    
    function stopDrawing() {
        if (isDrawing) {
            isDrawing = false;
            signatureInput.value = canvas.toDataURL();
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
        filename: 'טופס_161_חלק_ג_' + new Date().getTime() + '.pdf',
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


