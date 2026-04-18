// Global counters for dynamic rows
let workPeriodCounter = 0;
let installmentCounter = 0;
let nonTaxExemptGrantCounter = 0;
let taxExemptGrantCounter = 0;
let preRetirementPensionCounter = 0;
let isApplyingSnapshot = false;

const SALARY_INTEGER_FIELD_IDS = ['fullLastSalaryBeforeRetirement', 'lastInsuredSalary', 'severanceSalary'];
const PAYER_TYPE_OPTIONS = [
    { value: '1', full: '1 - המעסיק', short: '1' },
    { value: '2', full: '2 - מנהל הגמלאות', short: '2' },
    { value: '3', full: '3 - קופה מרכזית לפיצויים', short: '3' },
    { value: '4', full: '4 - קופה אישית לפיצויים', short: '4' },
    { value: '5', full: '5 - קופת פנסיה וותיקה', short: '5' },
    { value: '6', full: '6 - קופת פנסיה חדשה מ-1995', short: '6' }
];

const PRE_RETIREMENT_PAYER_TYPE_OPTIONS = PAYER_TYPE_OPTIONS.filter(
    o => o.value === '5' || o.value === '6'
);

function stripSalaryDigits(str) {
    return String(str || '').replace(/\D/g, '');
}

function formatSalaryIntegerDisplay(digitsSource) {
    return formatMoneyWhileTyping(digitsSource);
}

function parseSalaryFieldToInt(field) {
    if (!field) return NaN;
    return parseMoneyFormatted(field.value);
}

function salaryIntFromFormData(formData, name) {
    const raw = formData.get(name);
    return parseMoneyFormatted(raw == null ? '' : raw);
}

function parseMoneyFormatted(str) {
    const cleaned = String(str == null ? '' : str).replace(/,/g, '').replace(/\s/g, '').trim();
    if (cleaned === '' || cleaned === '.') return NaN;
    const n = parseFloat(cleaned);
    return n;
}

function formatMoneyAccounting(n) {
    if (typeof n !== 'number' || isNaN(n)) return '';
    return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
}

function formatMoneyWhileTyping(raw) {
    const d = String(raw || '').replace(/[^\d.]/g, '');
    const firstDot = d.indexOf('.');
    const intRaw = (firstDot === -1 ? d : d.slice(0, firstDot)).replace(/\D/g, '').slice(0, 12);
    const fracRaw = firstDot === -1 ? '' : d.slice(firstDot + 1).replace(/\D/g, '').slice(0, 2);
    if (intRaw === '' && fracRaw === '' && firstDot === -1) return '';
    const intNum = intRaw === '' ? 0 : parseInt(intRaw, 10);
    const intStr = intRaw === '' ? '' : String(intNum);
    const intDisp = intStr === '' ? '' : intStr.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    if (firstDot >= 0) {
        const left = intDisp === '' ? '0' : intDisp;
        return left + '.' + fracRaw;
    }
    return intDisp;
}

function moneyForXml(n) {
    if (typeof n !== 'number' || isNaN(n)) return '';
    const r = Math.round(n * 100) / 100;
    if (Math.abs(r - Math.round(r)) < 1e-9) return String(Math.round(r));
    return r.toFixed(2);
}

function fitTextToInput(inputEl) {
    if (!inputEl) return;
    const len = String(inputEl.value || '').length;
    let size = '1em';
    if (len > 28) size = '0.74em';
    else if (len > 22) size = '0.8em';
    else if (len > 16) size = '0.88em';
    inputEl.style.fontSize = size;
}

function initAdaptiveTextInput(inputEl) {
    if (!inputEl) return;
    inputEl.classList.add('adaptive-text-input');
    const update = () => fitTextToInput(inputEl);
    inputEl.addEventListener('input', update);
    inputEl.addEventListener('blur', update);
    update();
}

function payerTypeOptionDefsForSelect(selectEl) {
    if (selectEl && selectEl._payerTypeOptionDefs && selectEl._payerTypeOptionDefs.length) {
        return selectEl._payerTypeOptionDefs;
    }
    return PAYER_TYPE_OPTIONS;
}

function setPayerTypeSelectMode(selectEl, expanded) {
    if (!selectEl) return;
    const defs = payerTypeOptionDefsForSelect(selectEl);
    Array.from(selectEl.options).forEach(option => {
        if (!option.value) return;
        const match = defs.find(item => item.value === option.value);
        if (!match) return;
        option.textContent = expanded ? match.full : match.short;
    });
}

function initPayerTypeSelect(selectEl, optionDefs) {
    if (!selectEl) return;
    if (optionDefs && Array.isArray(optionDefs) && optionDefs.length) {
        selectEl._payerTypeOptionDefs = optionDefs;
    } else {
        delete selectEl._payerTypeOptionDefs;
    }
    selectEl.classList.add('code-select');
    setPayerTypeSelectMode(selectEl, false);
    selectEl.addEventListener('focus', function () {
        setPayerTypeSelectMode(selectEl, true);
    });
    selectEl.addEventListener('mousedown', function () {
        setPayerTypeSelectMode(selectEl, true);
    });
    selectEl.addEventListener('change', function () {
        setPayerTypeSelectMode(selectEl, false);
    });
    selectEl.addEventListener('blur', function () {
        setPayerTypeSelectMode(selectEl, false);
    });
}

/** תיק ניכויים 9 + 8 ספרות — אותה התנהגות כמו שדה א.2 */
function initDeductionFileNinePrefixControl(inputEl) {
    if (!inputEl) return;

    inputEl.addEventListener('focus', function() {
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

    inputEl.addEventListener('keydown', function(e) {
        if (this.selectionStart <= 1 && (e.key === 'Backspace' || e.key === 'Delete')) {
            if (this.value.startsWith('9') && this.selectionStart === 1) {
                e.preventDefault();
            }
        }
        if (e.key === 'ArrowLeft' && this.selectionStart <= 1) {
            if (this.value.startsWith('9')) {
                e.preventDefault();
                this.setSelectionRange(1, 1);
            }
        }
    });

    inputEl.addEventListener('input', function() {
        let value = this.value.replace(/\D/g, '');
        if (!value.startsWith('9')) {
            value = '9' + value.replace(/^9+/, '');
        }
        if (value.length > 9) {
            value = value.substring(0, 9);
        }
        const cursorPos = this.selectionStart;
        this.value = value;
        setTimeout(() => {
            const newPos = Math.max(1, Math.min(cursorPos, value.length));
            this.setSelectionRange(newPos, newPos);
        }, 0);
    });

    inputEl.addEventListener('blur', function() {
        let value = this.value.replace(/\D/g, '');
        if (value && !value.startsWith('9')) {
            value = '9' + value.replace(/^9+/, '');
        }
        if (!value) {
            value = '9';
        }
        this.value = value;
    });
}

function attachGrantMoneyInputs(card, idx) {
    const amount = card.querySelector('input[name="amountForRetirementDay_' + idx + '"]');
    const extra = card.querySelector('input[name="additionalAccumulation_' + idx + '"]');
    const total = card.querySelector('.grant-total-input');
    if (!amount || !extra || !total) return;

    function updateTotal() {
        const a = parseMoneyFormatted(amount.value);
        const b = parseMoneyFormatted(extra.value);
        const aEmpty = String(amount.value || '').trim() === '';
        const bEmpty = String(extra.value || '').trim() === '';
        if (aEmpty && bEmpty) {
            total.value = '';
            refreshA9ToA11Totals();
            return;
        }
        const sum = (isNaN(a) ? 0 : a) + (isNaN(b) ? 0 : b);
        total.value = formatMoneyAccounting(sum);
        refreshA9ToA11Totals();
    }

    function wire(inp) {
        inp.addEventListener('keydown', function(e) {
            if (['e', 'E', '+', '-'].includes(e.key)) {
                e.preventDefault();
            }
        });
        inp.addEventListener('input', function() {
            this.value = formatMoneyWhileTyping(this.value);
            this.setSelectionRange(this.value.length, this.value.length);
            updateTotal();
        });
        inp.addEventListener('blur', function() {
            if (String(this.value || '').trim() !== '') {
                const n = parseMoneyFormatted(this.value);
                if (!isNaN(n)) {
                    this.value = formatMoneyAccounting(n);
                }
            }
            updateTotal();
        });
    }

    wire(amount);
    wire(extra);
    if (!String(extra.value || '').trim()) {
        extra.value = '0.00';
    }
    updateTotal();
}

function initGrantRowBehaviors(card, idx) {
    const payerName = card.querySelector('input[name="payerName_' + idx + '"]');
    const ded = card.querySelector('input[name="payerDeductionFile_' + idx + '"]');
    const payerType = card.querySelector('select[name="payerTypeCode_' + idx + '"]');
    if (payerName) {
        initAdaptiveTextInput(payerName);
    }
    if (ded) {
        initDeductionFileNinePrefixControl(ded);
        ded.addEventListener('blur', function grantDeductionBlurValidate() {
            const v = stripSalaryDigits(this.value);
            const err = this.parentElement.querySelector('.error-message');
            this.classList.remove('error');
            if (err) err.style.display = 'none';
            if (v.length > 0 && !/^9\d{8}$/.test(v)) {
                this.classList.add('error');
                if (err) err.style.display = 'block';
            }
        });
    }
    if (payerType) {
        initPayerTypeSelect(payerType);
        payerType.addEventListener('change', refreshA9ToA11Totals);
        payerType.addEventListener('blur', refreshA9ToA11Totals);
    }
    attachGrantMoneyInputs(card, idx);
}

function initMoneyFormattedInput(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener('keydown', function (e) {
        if (['e', 'E', '+', '-'].includes(e.key)) {
            e.preventDefault();
        }
    });
    inputEl.addEventListener('input', function () {
        this.value = formatMoneyWhileTyping(this.value);
        this.setSelectionRange(this.value.length, this.value.length);
    });
    inputEl.addEventListener('blur', function () {
        if (String(this.value || '').trim() !== '') {
            const n = parseMoneyFormatted(this.value);
            if (!isNaN(n)) {
                this.value = formatMoneyAccounting(n);
            }
        }
    });
}

function sumParsedValuesFromSelector(selector, root) {
    const scope = root || document;
    let sum = 0;
    scope.querySelectorAll(selector).forEach(el => {
        const n = parseMoneyFormatted(el.value);
        if (!isNaN(n)) sum += n;
    });
    return sum;
}

function computePartA9Total() {
    return sumParsedValuesFromSelector('#nonTaxExemptGrantsBody .grant-total-input');
}

function computePartA9PensionFundsTotal() {
    let sum = 0;
    const cards = document.querySelectorAll('#nonTaxExemptGrantsBody .grant-card');
    cards.forEach(card => {
        const payerType = card.querySelector('select[name^="payerTypeCode_"]');
        if (!payerType || (payerType.value !== '5' && payerType.value !== '6')) return;
        const totalInput = card.querySelector('.grant-total-input');
        const n = parseMoneyFormatted(totalInput ? totalInput.value : '');
        if (!isNaN(n)) sum += n;
    });
    return sum;
}

function computePartA10Totals() {
    const nominalSum = sumParsedValuesFromSelector('#taxExemptGrantsBody input[name^="nominalDeductiblePaymentAmount_"]');
    const realSum = sumParsedValuesFromSelector('#taxExemptGrantsBody input[name^="realDeductiblePaymentAmount_"]');
    return { nominal: nominalSum, real: realSum, total: nominalSum + realSum };
}

function computePartA11Total() {
    return sumParsedValuesFromSelector('#preRetirementPensionBody input[name^="conversionAmountBalance_"]');
}

function setAutoNumericFieldValue(fieldId, value) {
    const field = document.getElementById(fieldId);
    if (!field) return;
    const n = typeof value === 'number' && !isNaN(value) ? value : 0;
    field.value = formatMoneyAccounting(Math.round(n * 100) / 100);
}

function hasOnlyOneOfPrefixAndPhone(prefixValue, phoneValue) {
    const hasPrefix = String(prefixValue || '').trim() !== '';
    const hasPhone = String(phoneValue || '').trim() !== '';
    return (hasPrefix && !hasPhone) || (!hasPrefix && hasPhone);
}

function validateContactPhonePair(showAlert) {
    const prefixField = document.getElementById('contactPhonePrefix');
    const phoneField = document.getElementById('contactPhoneNumber');
    if (!prefixField || !phoneField) return true;

    const invalid = hasOnlyOneOfPrefixAndPhone(prefixField.value, phoneField.value);
    prefixField.classList.remove('error');
    phoneField.classList.remove('error');
    if (!invalid) return true;

    prefixField.classList.add('error');
    phoneField.classList.add('error');
    if (showAlert) {
        showAppAlert('בחלק א.2: יש למלא גם קידומת וגם מספר טלפון נייד, או להשאיר את שניהם ריקים.');
    }
    return false;
}

function isNonTaxExemptGrantCardComplete(card) {
    if (!card) return false;
    let complete = true;
    const inputs = card.querySelectorAll('input[name], select[name]');
    inputs.forEach(el => {
        if (!el || el.disabled || el.readOnly || el.type === 'button') return;
        // חלק א.9: "צבירה נוספת" אינו שדה חובה להשלמת שורה
        if (typeof el.name === 'string' && /^additionalAccumulation_/.test(el.name)) {
            el.classList.remove('error');
            return;
        }
        if (String(el.value || '').trim() === '') {
            el.classList.add('error');
            complete = false;
        } else {
            el.classList.remove('error');
        }
    });

    const deduction = card.querySelector('input[name^="payerDeductionFile_"]');
    if (deduction) {
        const digits = stripSalaryDigits(deduction.value);
        if (!/^9\d{8}$/.test(digits)) {
            deduction.classList.add('error');
            complete = false;
        }
    }

    return complete;
}

function isPreRetirementGrantCardComplete(card) {
    if (!card) return false;
    let complete = true;
    const inputs = card.querySelectorAll('input[name], select[name]');
    inputs.forEach(el => {
        if (!el || el.disabled || el.readOnly || el.type === 'hidden' || el.type === 'button') return;
        if (String(el.value || '').trim() === '') {
            el.classList.add('error');
            complete = false;
        } else {
            el.classList.remove('error');
        }
    });
    const deduction = card.querySelector('input[name^="preRetirementPayerDeductionFile_"]');
    if (deduction) {
        const digits = stripSalaryDigits(deduction.value);
        if (!/^9\d{8}$/.test(digits)) {
            deduction.classList.add('error');
            complete = false;
        }
    }
    const pensionAmount = card.querySelector('input[name^="pensionAmount_"]');
    const totalAmount = card.querySelector('input[name^="conversionAmountBalance_"]');
    if (pensionAmount) {
        const n = parseMoneyFormatted(pensionAmount.value);
        if (isNaN(n) || n < 1) {
            pensionAmount.classList.add('error');
            complete = false;
        }
    }
    if (totalAmount) {
        const n = parseMoneyFormatted(totalAmount.value);
        if (isNaN(n) || n < 1) {
            totalAmount.classList.add('error');
            complete = false;
        }
    }
    return complete;
}

function normalizeInstallmentPaymentDateFields() {
    document.querySelectorAll('input[name^="paymentTaxYear_"]').forEach(inp => {
        const v = String(inp.value || '').trim();
        if (/^\d{4}$/.test(v)) {
            inp.value = v + '-01-01';
        }
    });
}

function refreshA9ToA11Totals() {
    const a9 = computePartA9Total();
    const a9PensionFunds = computePartA9PensionFundsTotal();
    const a10Totals = computePartA10Totals();
    const a11 = computePartA11Total();
    const a9ToA11 = a9 + a10Totals.nominal + a11;
    const pensionContinuity = a9PensionFunds + a10Totals.nominal + a11;

    const a9Display = document.getElementById('partA9TotalDisplay');
    const a10NominalDisplay = document.getElementById('partA10NominalTotalDisplay');
    const a10RealDisplay = document.getElementById('partA10RealTotalDisplay');
    const a11Display = document.getElementById('partA11TotalDisplay');
    const a9ToA11Display = document.getElementById('partA9ToA11TotalDisplay');
    const a10SummaryRow = document.getElementById('partA10SummaryRow');
    const a11SummaryRow = document.getElementById('partA11SummaryRow');
    const a9ToA11SummaryRow = document.getElementById('partA9ToA11SummaryRow');

    const a10Rows = document.querySelectorAll('#taxExemptGrantsBody tr').length;
    const a11Rows = document.querySelectorAll('#preRetirementPensionBody .prp-grant-card').length;
    const hasA10Rows = a10Rows > 0;
    const hasA11Rows = a11Rows > 0;

    if (a9Display) a9Display.value = formatMoneyAccounting(a9);

    if (a10NominalDisplay) {
        a10NominalDisplay.value = hasA10Rows ? formatMoneyAccounting(a10Totals.nominal) : '0.00';
    }
    if (a10RealDisplay) {
        a10RealDisplay.value = hasA10Rows ? formatMoneyAccounting(a10Totals.real) : '0.00';
    }
    if (a10SummaryRow) {
        a10SummaryRow.style.display = hasA10Rows ? 'table-row' : 'none';
    }

    if (a11Display) {
        a11Display.value = hasA11Rows ? formatMoneyAccounting(a11) : '0.00';
    }
    if (a11SummaryRow) {
        a11SummaryRow.style.display = hasA11Rows ? 'grid' : 'none';
    }

    if (a9ToA11Display) {
        a9ToA11Display.value = formatMoneyAccounting(a9ToA11);
    }
    if (a9ToA11SummaryRow) {
        a9ToA11SummaryRow.style.display = 'grid';
    }

    // Part A.13 auto-filled fields
    setAutoNumericFieldValue('maxTotalGrantAmount', a9ToA11);
    setAutoNumericFieldValue('maxPensionContinuityAmount', pensionContinuity);
    setAutoNumericFieldValue('maxTaxableGrantAmount', a9);
}

function initTaxExemptGrantRow(row, idx) {
    const payerName = row.querySelector('input[name="taxExemptPayerName_' + idx + '"]');
    const deduction = row.querySelector('input[name="taxExemptPayerDeductionFile_' + idx + '"]');
    const nominal = row.querySelector('input[name="nominalDeductiblePaymentAmount_' + idx + '"]');
    const real = row.querySelector('input[name="realDeductiblePaymentAmount_' + idx + '"]');

    initAdaptiveTextInput(payerName);
    initDeductionFileNinePrefixControl(deduction);
    if (deduction) {
        deduction.addEventListener('blur', function () {
            const v = stripSalaryDigits(this.value);
            this.classList.remove('error');
            if (v.length > 0 && !/^9\d{8}$/.test(v)) {
                this.classList.add('error');
            }
        });
    }
    initMoneyFormattedInput(nominal);
    initMoneyFormattedInput(real);
    [nominal, real].forEach(inp => {
        if (!inp) return;
        inp.addEventListener('input', refreshA9ToA11Totals);
        inp.addEventListener('blur', refreshA9ToA11Totals);
    });
}

// Initialize form
document.addEventListener('DOMContentLoaded', function() {
    // Handle form type (original/amended)
    const formTypeOriginal = document.getElementById('formTypeOriginal');
    const formTypeAmended = document.getElementById('formTypeAmended');
    const previousFormDateContainer = document.getElementById('previousFormDateContainer');
    
    formTypeOriginal.addEventListener('change', function() {
        if (this.checked) {
            formTypeAmended.checked = false;
            previousFormDateContainer.style.display = 'none';
        } else if (!formTypeAmended.checked) {
            // If both are unchecked, check original
            this.checked = true;
        }
    });
    
    formTypeAmended.addEventListener('change', function() {
        if (this.checked) {
            formTypeOriginal.checked = false;
            previousFormDateContainer.style.display = 'block';
        } else {
            previousFormDateContainer.style.display = 'none';
            // If amended is unchecked, check original
            formTypeOriginal.checked = true;
        }
    });

    // Handle controlling interest checkboxes - only one can be selected
    const holderCheckbox = document.getElementById('holderOfControllingInterest');
    const relativeHolderCheckbox = document.getElementById('relativeHolderOfControllingInterest');
    const relationshipTypeSelect = document.getElementById('relationshipType');
    
    // Disable relationship select initially
    relationshipTypeSelect.disabled = true;
    
    holderCheckbox.addEventListener('change', function() {
        if (this.checked) {
            // If holder is checked, uncheck relative and disable relationship select
            relativeHolderCheckbox.checked = false;
            relationshipTypeSelect.disabled = true;
            relationshipTypeSelect.value = '';
        }
    });
    
    relativeHolderCheckbox.addEventListener('change', function() {
        if (this.checked) {
            // If relative is checked, uncheck holder and enable relationship select
            holderCheckbox.checked = false;
            relationshipTypeSelect.disabled = false;
        } else {
            relationshipTypeSelect.disabled = true;
            relationshipTypeSelect.value = ''; // Clear selection when disabled
        }
    });

    // Handle budgetary pension option change
    document.querySelectorAll('input[name="budgetaryPensionOption"]').forEach(radio => {
        radio.addEventListener('change', function() {
            const detailsDiv = document.getElementById('budgetaryPensionDetails');
            if (this.value === 'entitled') {
                detailsDiv.style.display = 'block';
            } else {
                detailsDiv.style.display = 'none';
            }
        });
    });

    // Handle tax exempt option change
    document.querySelectorAll('input[name="taxExemptOption"]').forEach(radio => {
        radio.addEventListener('change', function() {
            const container = document.getElementById('taxExemptGrantsContainer');
            if (this.value === 'yes') {
                container.style.display = 'block';
            } else {
                container.style.display = 'none';
            }
            refreshA9ToA11Totals();
        });
    });

    // Form validation
    document.getElementById('form161').addEventListener('submit', function(e) {
        e.preventDefault();
        if (validateForm()) {
            generateXML();
        }
    });

    // Real-time validation
    setupValidation();

    // Section accordion behavior + guarded navigation from A.1 to A.2
    setupSectionAccordion();

    // מדריך למילוי, הסברים לפי חלקים ו-tooltips לשדות
    if (typeof initForm161Guide === 'function') {
        initForm161Guide();
    }

    // Restrict specific fields to numeric-only input where required
    setupNumericInputRestrictions();
    
    // הגדלת ה-calendar popup בלבד (רק הלוח שנפתח)
    setupCalendarPopupZoom();

    setupEmploymentPeriodAutoFill();

    setupSalaryIntegerInputs();
    setupOperationPanel();

    const employerDeductionFileInput = document.getElementById('employerDeductionFile');
    initDeductionFileNinePrefixControl(employerDeductionFileInput);
    const finalizeBtn = document.getElementById('finalizeFormBtn');
    if (finalizeBtn) {
        finalizeBtn.addEventListener('click', function () {
            runFinalizeFormCheck();
        });
    }

    initMoneyFormattedInput(document.getElementById('maxSeveranceContinuityAmount'));
    initMoneyFormattedInput(document.getElementById('maxExemptGrantAmount'));

    refreshA9ToA11Totals();
});

function setupSectionAccordion() {
    const sections = Array.from(document.querySelectorAll('.form-section'));
    if (!sections.length) return;

    // Small visual cues for collapsible section titles
    sections.forEach((section, index) => {
        const title = section.querySelector('.section-title');
        if (!title) return;

        title.style.cursor = 'pointer';
        if (!title.querySelector('.section-toggle-arrow')) {
            const arrow = document.createElement('span');
            arrow.className = 'section-toggle-arrow';
            arrow.setAttribute('aria-hidden', 'true');
            arrow.textContent = '▼';
            title.prepend(arrow);
        }
        title.setAttribute('role', 'button');
        title.setAttribute('tabindex', '0');
        title.setAttribute('aria-expanded', index === 0 ? 'true' : 'false');

        if (index !== 0) {
            collapseSection(section);
        }

        const onToggle = () => {
            // Block opening a later section until all previous required fields are valid
            if (!validateSectionsBefore(index)) {
                return;
            }

            const isCollapsed = section.classList.contains('section-collapsed');
            if (isCollapsed) {
                expandSection(section);
            } else {
                collapseSection(section);
            }
        };

        title.addEventListener('click', onToggle);
        title.addEventListener('keydown', function(event) {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                onToggle();
            }
        });
    });
}

function collapseSection(section) {
    const title = section.querySelector('.section-title');
    if (!title) return;

    Array.from(section.children).forEach(child => {
        if (child !== title) {
            child.style.display = 'none';
        }
    });

    section.classList.add('section-collapsed');
    title.setAttribute('aria-expanded', 'false');
}

function expandSection(section) {
    const title = section.querySelector('.section-title');
    if (!title) return;

    Array.from(section.children).forEach(child => {
        if (child !== title) {
            child.style.display = '';
        }
    });

    section.classList.remove('section-collapsed');
    title.setAttribute('aria-expanded', 'true');
}

function validateSectionsBefore(targetSectionIndex) {
    if (targetSectionIndex <= 0) return true;

    const sections = Array.from(document.querySelectorAll('.form-section'));
    let isValid = true;

    for (let i = 0; i < targetSectionIndex; i++) {
        const section = sections[i];
        if (!section) continue;

        const requiredFields = section.querySelectorAll('[required]');
        const validatedRadioGroups = new Set();

        requiredFields.forEach(field => {
            if (field.type === 'radio') {
                if (validatedRadioGroups.has(field.name)) {
                    return;
                }
                validatedRadioGroups.add(field.name);
            }

            if (!validateField(field)) {
                isValid = false;
                expandSection(section);
            }
        });
    }

    // Keep Israeli ID checksum validation only when opening A.2 or later
    if (targetSectionIndex >= 1 && !validatePartA1BeforeA2Transition(false)) {
        isValid = false;
    }

    if (!isValid) {
        showAppAlert('לא ניתן לפתוח חלק מאוחר יותר לפני מילוי תקין של שדות החובה בחלקים הקודמים');
    }

    return isValid;
}

function validatePartA1BeforeA2Transition(showAlert = true) {
    const sectionA1 = document.querySelectorAll('.form-section')[0];
    if (!sectionA1) return true;

    const requiredFields = sectionA1.querySelectorAll('[required]');
    let isValid = true;

    requiredFields.forEach(field => {
        if (!validateField(field)) {
            isValid = false;
        }
    });

    const idField = document.getElementById('employeeIdNumber');
    if (idField) {
        const idValue = (idField.value || '').trim();
        if (!isValidIsraeliId(idValue)) {
            idField.classList.add('error');
            const errorMessage = idField.parentElement.querySelector('.error-message');
            if (errorMessage) {
                errorMessage.textContent = 'מספר זהות לא תקין לפי נוסחת משרד הפנים';
                errorMessage.style.display = 'block';
            }
            isValid = false;
        }
    }

    if (!isValid && showAlert) {
        showAppAlert('לא ניתן לעבור לחלק א.2 לפני השלמת שדות החובה התקינים בחלק א.1');
        expandSection(sectionA1);
    } else if (!isValid) {
        expandSection(sectionA1);
    }

    return isValid;
}

function isValidIsraeliId(id) {
    if (!/^\d{9}$/.test(id)) return false;

    let sum = 0;
    for (let i = 0; i < 9; i++) {
        let digit = Number(id[i]) * ((i % 2) + 1);
        if (digit > 9) {
            digit -= 9;
        }
        sum += digit;
    }
    return sum % 10 === 0;
}

function setupNumericInputRestrictions() {
    restrictToDigits('employeeIdNumber', 9);
    restrictToDigits('employeeZipCode', 7);
    restrictToDigits('employerZipCode', 7);
    restrictToDigits('employeePhoneNumber', 7);
    restrictToDigits('contactPhoneNumber', 7);
}

function restrictToDigits(elementId, maxLength) {
    const field = document.getElementById(elementId);
    if (!field) return;

    field.addEventListener('input', function() {
        const digitsOnly = this.value.replace(/\D/g, '').slice(0, maxLength);
        if (this.value !== digitsOnly) {
            this.value = digitsOnly;
        }
    });
}

function setupSalaryIntegerInputs() {
    const uniform = document.getElementById('uniformSalaryCheckbox');
    const primary = document.getElementById('fullLastSalaryBeforeRetirement');
    const second = document.getElementById('lastInsuredSalary');
    const third = document.getElementById('severanceSalary');
    if (!uniform || !primary || !second || !third) return;

    function applyUniformFromPrimary() {
        if (!uniform.checked) return;
        const v = primary.value;
        second.value = v;
        third.value = v;
    }

    function setSyncedReadonly(locked) {
        second.readOnly = locked;
        third.readOnly = locked;
        second.classList.toggle('salary-readonly-sync', locked);
        third.classList.toggle('salary-readonly-sync', locked);
    }

    uniform.addEventListener('change', function() {
        if (this.checked) {
            setSyncedReadonly(true);
            applyUniformFromPrimary();
        } else {
            setSyncedReadonly(false);
        }
    });

    SALARY_INTEGER_FIELD_IDS.forEach(function (fieldId) {
        const el = document.getElementById(fieldId);
        if (!el) return;

        el.addEventListener('keydown', function (e) {
            if (['e', 'E', '+', '-'].includes(e.key)) {
                e.preventDefault();
            }
        });

        el.addEventListener('paste', function (e) {
            e.preventDefault();
            if (uniform.checked && (fieldId === 'lastInsuredSalary' || fieldId === 'severanceSalary')) {
                el.value = primary.value;
                return;
            }
            const text = (e.clipboardData || window.clipboardData).getData('text');
            el.value = formatSalaryIntegerDisplay(text);
            el.setSelectionRange(el.value.length, el.value.length);
            if (uniform.checked && fieldId === 'fullLastSalaryBeforeRetirement') {
                applyUniformFromPrimary();
            }
        });

        el.addEventListener('input', function () {
            if (uniform.checked && (fieldId === 'lastInsuredSalary' || fieldId === 'severanceSalary')) {
                el.value = primary.value;
                return;
            }
            el.value = formatSalaryIntegerDisplay(el.value);
            el.setSelectionRange(el.value.length, el.value.length);
            if (uniform.checked && fieldId === 'fullLastSalaryBeforeRetirement') {
                applyUniformFromPrimary();
            }
        });

        el.addEventListener('blur', function () {
            if (String(el.value || '').trim() !== '') {
                const n = parseMoneyFormatted(el.value);
                if (!isNaN(n)) {
                    el.value = formatMoneyAccounting(n);
                }
            }
            if (uniform.checked && fieldId === 'fullLastSalaryBeforeRetirement') {
                applyUniformFromPrimary();
            }
        });
    });

    if (uniform.checked) {
        setSyncedReadonly(true);
        applyUniformFromPrimary();
    }
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

// Setup real-time validation
function setupValidation() {
    const form = document.getElementById('form161');
    const inputs = form.querySelectorAll('input, select');
    
    inputs.forEach(input => {
        input.addEventListener('blur', function() {
            validateField(this);
        });
    });
}

// Validate single field
function validateField(field) {
    let isValid = true;
    const errorMessage = field.parentElement.querySelector('.error-message');
    
    // Remove previous error state
    field.classList.remove('error');
    if (errorMessage) {
        errorMessage.style.display = 'none';
    }

    // Check required fields
    if (field.hasAttribute('required')) {
        if (field.type === 'radio') {
            const group = document.querySelectorAll(`input[type="radio"][name="${field.name}"]`);
            const groupChecked = Array.from(group).some(radio => radio.checked);
            if (!groupChecked) {
                isValid = false;
                group.forEach(radio => radio.classList.add('error'));
            } else {
                group.forEach(radio => radio.classList.remove('error'));
            }
        } else if (field.type === 'checkbox') {
            if (!field.checked) {
                isValid = false;
            }
        } else if (!field.value.trim()) {
            isValid = false;
        }
    }

    if (SALARY_INTEGER_FIELD_IDS.includes(field.id)) {
        const n = parseSalaryFieldToInt(field);
        if (!isNaN(n)) {
            if (n < 1 || n > 9999999) {
                isValid = false;
            }
        } else if (field.hasAttribute('required')) {
            isValid = false;
        }
    }

    // Pattern validation
    if (field.value && field.hasAttribute('pattern')) {
        const pattern = new RegExp(field.getAttribute('pattern'));
        if (!pattern.test(field.value)) {
            isValid = false;
        }
    }

    // Phone number validation (for phone number fields)
    if (field.id === 'employeePhoneNumber' || field.id === 'contactPhoneNumber') {
        if (field.value && field.value.startsWith('0')) {
            isValid = false;
        }

        const prefixField = field.id === 'employeePhoneNumber' 
            ? document.getElementById('employeePhonePrefix')
            : document.getElementById('contactPhonePrefix');
        if (field.value && (!prefixField || !prefixField.value)) {
            // Show error on prefix field if number is filled but prefix is not
            if (prefixField) {
                prefixField.classList.add('error');
            }
        }
    }

    // Email validation
    if (field.type === 'email' && field.value) {
        const emailPattern = /^[^@\s]+@[^@\s]+$/;
        if (!emailPattern.test(field.value) || field.value.length < 3 || field.value.length > 70) {
            isValid = false;
        }
    }

    // Date validation
    if (field.type === 'date' && field.value) {
        const date = new Date(field.value);
        if (isNaN(date.getTime())) {
            isValid = false;
        }
    }

    if (!isValid) {
        field.classList.add('error');
        if (errorMessage) {
            errorMessage.style.display = 'block';
        }
    }

    return isValid;
}

// Validate entire form
function validateForm(showAlert = true) {
    const form = document.getElementById('form161');
    const requiredFields = form.querySelectorAll('[required]');
    let isValid = true;

    requiredFields.forEach(field => {
        if (!validateField(field)) {
            isValid = false;
        }
    });

    // Validate dates
    const startDate = document.getElementById('employmentStartDate').value;
    const endDate = document.getElementById('employmentRetirementDate').value;
    
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
        showAppAlert('תאריך התחלת העבודה לא יכול להיות אחרי תאריך הפרישה');
        isValid = false;
    }

    // Calculate employment period if dates are filled
    if (startDate && endDate && new Date(startDate) <= new Date(endDate)) {
        calculateEmploymentPeriod();
    }

    if (!validateContactPhonePair(false)) {
        isValid = false;
    }

    if (!isValid && showAlert) {
        showAppAlert('יש לתקן שגיאות בטופס לפני המשך');
    }

    return isValid;
}

function markInvalidAndExpand(field) {
    if (!field) return;
    field.classList.add('error');
    const msg = field.parentElement ? field.parentElement.querySelector('.error-message') : null;
    if (msg) msg.style.display = 'block';
    const section = field.closest('.form-section');
    if (section) expandSection(section);
}

function validateDynamicRowsForFinalize() {
    let isValid = true;

    if (!document.querySelector('input[name="retirementReason"]:checked')) {
        isValid = false;
        document.querySelectorAll('input[name="retirementReason"]').forEach(r => r.classList.add('error'));
        const first = document.querySelector('input[name="retirementReason"]');
        if (first) {
            const section = first.closest('.form-section');
            if (section) expandSection(section);
        }
    } else {
        document.querySelectorAll('input[name="retirementReason"]').forEach(r => r.classList.remove('error'));
    }

    document.querySelectorAll('#workPeriodsBody tr').forEach(row => {
        const start = row.querySelector('input[name^="workPeriodStartDate"]');
        const end = row.querySelector('input[name^="workPeriodEndDate"]');
        const rate = row.querySelector('input[name^="workPeriodEmploymentRate"]');
        const salary = row.querySelector('input[name^="workPeriodLastSalary"]');
        if (!start || !end || !rate || !salary) return;

        if (!String(start.value || '').trim()) {
            isValid = false;
            markInvalidAndExpand(start);
        }
        if (!String(end.value || '').trim()) {
            isValid = false;
            markInvalidAndExpand(end);
        }
        const rateNum = parseInt(String(rate.value || '').trim(), 10);
        if (!rate.value || String(rate.value).trim() === '' || isNaN(rateNum) || rateNum < 1 || rateNum > 300) {
            isValid = false;
            markInvalidAndExpand(rate);
        }
        const salNum = parseInt(String(salary.value || '').trim(), 10);
        if (String(salary.value || '').trim() === '' || isNaN(salNum) || salNum < 0) {
            isValid = false;
            markInvalidAndExpand(salary);
        }
    });

    const entitled = document.getElementById('budgetaryPensionEntitled');
    if (entitled && entitled.checked) {
        const entDate = document.getElementById('entitlementDate');
        const salBp = document.getElementById('salaryForBudgetaryPensionCalculation');
        if (!entDate || !String(entDate.value || '').trim()) {
            isValid = false;
            markInvalidAndExpand(entDate);
        }
        const bp = salBp ? parseInt(String(salBp.value || '').trim(), 10) : NaN;
        if (!salBp || String(salBp.value || '').trim() === '' || isNaN(bp) || bp < 1) {
            isValid = false;
            markInvalidAndExpand(salBp);
        }
    }

    document.querySelectorAll('#installmentsBody tr').forEach(row => {
        const dateInp = row.querySelector('input[name^="paymentTaxYear"]');
        const amountInp = row.querySelector('input[name^="paymentAmount"]');
        if (!dateInp || !amountInp) return;
        const d = String(dateInp.value || '').trim();
        if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) {
            isValid = false;
            markInvalidAndExpand(dateInp);
        }
        const amt = parseInt(String(amountInp.value || '').trim(), 10);
        if (!amountInp.value || String(amountInp.value).trim() === '' || isNaN(amt) || amt < 1) {
            isValid = false;
            markInvalidAndExpand(amountInp);
        }
    });

    const markRadioGroupRequired = function (name) {
        const radios = document.querySelectorAll(`input[type="radio"][name="${name}"]`);
        const checked = document.querySelector(`input[type="radio"][name="${name}"]:checked`);
        if (!checked) {
            radios.forEach(r => r.classList.add('error'));
            const first = radios[0];
            if (first) {
                const section = first.closest('.form-section');
                if (section) expandSection(section);
            }
            return false;
        }
        radios.forEach(r => r.classList.remove('error'));
        return true;
    };

    if (!markRadioGroupRequired('ceilingOption1')) isValid = false;
    if (!markRadioGroupRequired('grantsIncludeNonPension')) isValid = false;

    const maxSev = document.getElementById('maxSeveranceContinuityAmount');
    const maxExempt = document.getElementById('maxExemptGrantAmount');
    ['maxTotalGrantAmount', 'maxPensionContinuityAmount', 'maxTaxableGrantAmount'].forEach(id => {
        const el = document.getElementById(id);
        if (el && String(el.value || '').trim() === '') {
            isValid = false;
            markInvalidAndExpand(el);
        }
    });
    if (maxSev) {
        const nSev = parseMoneyFormatted(maxSev.value);
        if (String(maxSev.value || '').trim() === '' || isNaN(nSev) || nSev < 0) {
            isValid = false;
            markInvalidAndExpand(maxSev);
        }
    }
    if (maxExempt) {
        const nEx = parseMoneyFormatted(maxExempt.value);
        if (String(maxExempt.value || '').trim() === '' || isNaN(nEx) || nEx < 0) {
            isValid = false;
            markInvalidAndExpand(maxExempt);
        }
    }

    const a9Cards = document.querySelectorAll('#nonTaxExemptGrantsBody .grant-card');
    if (a9Cards.length === 0) {
        isValid = false;
        const secA9 = document.getElementById('nonTaxExemptGrantsContainer');
        if (secA9) {
            const s = secA9.closest('.form-section');
            if (s) expandSection(s);
        }
    }
    a9Cards.forEach(card => {
        if (!isNonTaxExemptGrantCardComplete(card)) {
            isValid = false;
            const s = card.closest('.form-section');
            if (s) expandSection(s);
        }
    });

    const taxExemptYes = document.getElementById('taxExemptYes');
    if (taxExemptYes && taxExemptYes.checked) {
        const rows = document.querySelectorAll('#taxExemptGrantsBody tr');
        if (rows.length === 0) {
            isValid = false;
            const sec = document.getElementById('taxExemptGrantsContainer');
            if (sec) {
                sec.style.display = 'block';
                const s = sec.closest('.form-section');
                if (s) expandSection(s);
            }
        }
        rows.forEach(row => {
            const payerName = row.querySelector('input[name^="taxExemptPayerName_"]');
            const deduction = row.querySelector('input[name^="taxExemptPayerDeductionFile_"]');
            const nominal = row.querySelector('input[name^="nominalDeductiblePaymentAmount_"]');
            const real = row.querySelector('input[name^="realDeductiblePaymentAmount_"]');

            [payerName, deduction, nominal, real].forEach(f => {
                if (!f || String(f.value || '').trim() === '') {
                    isValid = false;
                    if (f) markInvalidAndExpand(f);
                }
            });

            if (deduction) {
                const d = stripSalaryDigits(deduction.value);
                if (d && !/^9\d{8}$/.test(d)) {
                    isValid = false;
                    markInvalidAndExpand(deduction);
                }
            }
        });
    }

    const a11Cards = document.querySelectorAll('#preRetirementPensionBody .prp-grant-card');
    a11Cards.forEach(card => {
        if (!isPreRetirementGrantCardComplete(card)) {
            isValid = false;
            const s = card.closest('.form-section');
            if (s) expandSection(s);
        }
    });

    return isValid;
}

function expandSectionsWithErrors() {
    document.querySelectorAll('.error').forEach(el => {
        const section = el.closest('.form-section');
        if (section) expandSection(section);
    });
}

function runFinalizeFormCheck() {
    refreshA9ToA11Totals();
    const staticValid = validateForm(false);
    const dynamicValid = validateDynamicRowsForFinalize();
    const allValid = staticValid && dynamicValid;

    if (allValid) {
        showAppAlert('הטופס מלא והנתונים שנבדקו תקינים.', {
            icon: 'success',
            title: 'הכל תקין',
            timer: 1500,
            showConfirmButton: false,
            allowOutsideClick: true,
            toast: false,
            position: 'center'
        });
        return;
    }

    expandSectionsWithErrors();
    showAppAlert('נדרש למלא פרטים תקינים ופרטי חובה בטופס');
}

// Convert date from YYYY-MM-DD to YYYYMMDD
function formatDateYYYYMMDD(dateString) {
    if (!dateString) return '';
    return dateString.replace(/-/g, '');
}

// Convert date from YYYY-MM-DD to YYYY
function formatDateYYYY(dateString) {
    if (!dateString) return '';
    return dateString.substring(0, 4);
}

// Get controlling interest values
function getControllingInterestValues() {
    const holderOfControlling = document.getElementById('holderOfControllingInterest').checked ? 1 : 2;
    const relativeOfControlling = document.getElementById('relativeHolderOfControllingInterest').checked ? 1 : 2;
    return { holderOfControlling, relativeOfControlling };
}

// Add work period row
function addWorkPeriod() {
    if (workPeriodCounter >= 100) {
        showAppAlert('ניתן להוסיף עד 100 תקופות עבודה');
        return;
    }

    const tbody = document.getElementById('workPeriodsBody');
    const row = document.createElement('tr');
    row.id = `workPeriod_${workPeriodCounter}`;
    row.innerHTML = `
        <td><input type="date" name="workPeriodStartDate_${workPeriodCounter}" form="form161"></td>
        <td><input type="date" name="workPeriodEndDate_${workPeriodCounter}" form="form161"></td>
        <td><input type="number" name="workPeriodEmploymentRate_${workPeriodCounter}" min="1" max="300" form="form161"></td>
        <td><input type="number" name="workPeriodLastSalary_${workPeriodCounter}" min="0" form="form161"></td>
        <td><button type="button" class="btn btn-remove" onclick="removeWorkPeriod(${workPeriodCounter})">מחק</button></td>
    `;
    tbody.appendChild(row);
    workPeriodCounter++;
}

// Remove work period row
function removeWorkPeriod(id) {
    const row = document.getElementById(`workPeriod_${id}`);
    if (row) {
        row.remove();
    }
}

// Add installment row
function addInstallment() {
    if (installmentCounter >= 6) {
        showAppAlert('ניתן להוסיף עד 6 תשלומים');
        return;
    }

    const tbody = document.getElementById('installmentsBody');
    const row = document.createElement('tr');
    row.id = `installment_${installmentCounter}`;
    row.innerHTML = `
        <td><input type="date" name="paymentTaxYear_${installmentCounter}" form="form161"></td>
        <td><input type="number" name="paymentAmount_${installmentCounter}" min="1" max="999999999" form="form161"></td>
        <td><button type="button" class="btn btn-remove" onclick="removeInstallment(${installmentCounter})">מחק</button></td>
    `;
    tbody.appendChild(row);
    installmentCounter++;
}

// Remove installment row
function removeInstallment(id) {
    const row = document.getElementById(`installment_${id}`);
    if (row) {
        row.remove();
    }
}

// Add non-tax exempt grant row (כרטיס דו-שורתי — ללא גלילה אופקית)
function addNonTaxExemptGrant() {
    if (nonTaxExemptGrantCounter >= 10) {
        showAppAlert('ניתן להוסיף עד 10 מענקים');
        return;
    }

    const idx = nonTaxExemptGrantCounter;
    const list = document.getElementById('nonTaxExemptGrantsBody');
    if (!list) return;

    const existingCards = list.querySelectorAll('.grant-card');
    if (!isApplyingSnapshot && existingCards.length > 0) {
        const hasIncomplete = Array.from(existingCards).some(card => !isNonTaxExemptGrantCardComplete(card));
        if (hasIncomplete) {
            showAppAlert('בחלק א.9 לא ניתן להוסיף שורה חדשה לפני שכל השדות בשורות הקיימות מולאו.');
            return;
        }
    }

    const card = document.createElement('div');
    card.className = 'grant-card';
    card.id = 'nonTaxExemptGrant_' + idx;
    card.innerHTML = `
<div class="grant-card-grid">
    <div class="grant-stack">
        <div class="grant-field">
            <span class="grant-field-label">שם המשלם</span>
            <input type="text" name="payerName_${idx}" class="adaptive-text-input" maxlength="100" form="form161" autocomplete="organization">
        </div>
        <div class="grant-field">
            <span class="grant-field-label">מספר תיק הניכויים</span>
            <input type="text" name="payerDeductionFile_${idx}" class="deduction-file-input grant-deduction-file" maxlength="9" form="form161" autocomplete="off">
            <span class="error-message">מספר תיק ניכויים חייב להיות 9 ספרות המתחילות ב־9</span>
        </div>
    </div>
    <div class="grant-stack">
        <div class="grant-field">
            <span class="grant-field-label">קוד המשלם</span>
            <select name="payerTypeCode_${idx}" class="code-select" form="form161">
                <option value="">בחר</option>
                <option value="1">1 - המעסיק</option>
                <option value="2">2 - מנהל הגמלאות</option>
                <option value="3">3 - קופה מרכזית לפיצויים</option>
                <option value="4">4 - קופה אישית לפיצויים</option>
                <option value="5">5 - קופת פנסיה וותיקה</option>
                <option value="6">6 - קופת פנסיה חדשה מ-1995</option>
            </select>
        </div>
        <div class="grant-field">
            <span class="grant-field-label">סוג התשלום</span>
            <select name="paymentType_${idx}" form="form161">
                <option value="">בחר</option>
                <option value="20">20</option>
                <option value="22">22</option>
                <option value="23">23</option>
            </select>
        </div>
    </div>
    <div class="grant-stack">
        <div class="grant-field">
            <span class="grant-field-label">תאריך הפקדה ראשון</span>
            <input type="date" name="firstDepositDate_${idx}" form="form161">
        </div>
        <div class="grant-field">
            <span class="grant-field-label">תאריך הפקדה אחרון לקופה</span>
            <input type="date" name="lastDepositDate_${idx}" form="form161">
        </div>
    </div>
    <div class="grant-stack">
        <div class="grant-field">
            <span class="grant-field-label">הסכום ליום הפרישה</span>
            <input type="text" class="grant-money-input" name="amountForRetirementDay_${idx}" inputmode="decimal" autocomplete="off" form="form161">
        </div>
        <div class="grant-field">
            <span class="grant-field-label">צבירה נוספת</span>
            <input type="text" class="grant-money-input" name="additionalAccumulation_${idx}" inputmode="decimal" autocomplete="off" form="form161">
        </div>
    </div>
    <div class="grant-total-stack">
        <span class="grant-field-label">הסכום הכולל לרבות צבירה נוספת</span>
        <input type="text" class="grant-total-input grant-money-input" readonly tabindex="-1" aria-live="polite" value="">
    </div>
</div>
<button type="button" class="btn btn-remove grant-remove-btn" onclick="removeNonTaxExemptGrant(${idx})">מחק</button>
`;
    list.appendChild(card);
    initGrantRowBehaviors(card, idx);
    nonTaxExemptGrantCounter++;
    refreshA9ToA11Totals();
}

// Remove non-tax exempt grant row
function removeNonTaxExemptGrant(id) {
    const row = document.getElementById(`nonTaxExemptGrant_${id}`);
    if (row) {
        row.remove();
        refreshA9ToA11Totals();
    }
}

// Add tax exempt grant row
function addTaxExemptGrant() {
    if (taxExemptGrantCounter >= 10) {
        showAppAlert('ניתן להוסיף עד 10 הפקדות');
        return;
    }

    const tbody = document.getElementById('taxExemptGrantsBody');
    const row = document.createElement('tr');
    row.id = `taxExemptGrant_${taxExemptGrantCounter}`;
    row.innerHTML = `
        <td><input type="text" class="adaptive-text-input" name="taxExemptPayerName_${taxExemptGrantCounter}" maxlength="100" form="form161"></td>
        <td><input type="text" class="tax-exempt-deduction-file" name="taxExemptPayerDeductionFile_${taxExemptGrantCounter}" maxlength="9" form="form161"></td>
        <td><input type="text" class="grant-money-input tax-exempt-money-input" name="nominalDeductiblePaymentAmount_${taxExemptGrantCounter}" inputmode="decimal" autocomplete="off" form="form161"></td>
        <td><input type="text" class="grant-money-input tax-exempt-money-input" name="realDeductiblePaymentAmount_${taxExemptGrantCounter}" inputmode="decimal" autocomplete="off" form="form161"></td>
        <td><button type="button" class="btn btn-remove" onclick="removeTaxExemptGrant(${taxExemptGrantCounter})">מחק</button></td>
    `;
    tbody.appendChild(row);
    initTaxExemptGrantRow(row, taxExemptGrantCounter);
    taxExemptGrantCounter++;
    refreshA9ToA11Totals();
}

// Remove tax exempt grant row
function removeTaxExemptGrant(id) {
    const row = document.getElementById(`taxExemptGrant_${id}`);
    if (row) {
        row.remove();
        refreshA9ToA11Totals();
    }
}

// Add pre-retirement pension row (כרטיס כמו א.9 — אותו עיצוב)
function addPreRetirementPension() {
    if (preRetirementPensionCounter >= 5) {
        showAppAlert('ניתן להוסיף עד 5 קצבאות');
        return;
    }

    const idx = preRetirementPensionCounter;
    const list = document.getElementById('preRetirementPensionBody');
    if (!list) return;

    const card = document.createElement('div');
    card.className = 'grant-card prp-grant-card';
    card.id = `preRetirementPension_${idx}`;
    card.innerHTML = `
<div class="prp-card-grid">
    <div class="prp-pair-row">
        <div class="grant-field">
            <span class="grant-field-label">שם המשלם</span>
            <input type="text" name="preRetirementPayerName_${idx}" class="adaptive-text-input" maxlength="100" form="form161" autocomplete="organization">
        </div>
        <div class="grant-field">
            <span class="grant-field-label">תיק ניכויים משלם</span>
            <input type="text" name="preRetirementPayerDeductionFile_${idx}" class="deduction-file-input grant-deduction-file" maxlength="9" form="form161" autocomplete="off" inputmode="numeric">
            <span class="error-message">מספר תיק ניכויים חייב להיות 9 ספרות המתחילות ב־9</span>
        </div>
    </div>
    <div class="grant-field prp-code-field">
        <span class="grant-field-label">קוד המשלם</span>
        <div class="prp-code-split">
            <select name="preRetirementPayerTypeCode_${idx}" class="code-select prp-code-select" form="form161">
                <option value="">בחר</option>
                <option value="1">1 - המעסיק</option>
                <option value="2">2 - מנהל הגמלאות</option>
                <option value="3">3 - קופה מרכזית לפיצויים</option>
                <option value="4">4 - קופה אישית לפיצויים</option>
                <option value="5">5 - קופת פנסיה וותיקה</option>
                <option value="6">6 - קופת פנסיה חדשה מ-1995</option>
            </select>
            <div class="prp-payment-type-band" aria-label="סוג התשלום קבוע 30">
                <span>סוג התשלום</span>
                <span class="prp-type-30-num">30</span>
            </div>
        </div>
        <input type="hidden" name="preRetirementPaymentTypeFixed_${idx}" value="30" form="form161">
    </div>
    <div class="grant-field">
        <span class="grant-field-label">חודש המרה לקצבה</span>
        <input type="date" name="pensionConversionDate_${idx}" form="form161">
    </div>
    <div class="grant-field">
        <span class="grant-field-label">סכום הקצבה</span>
        <input type="text" class="grant-money-input" name="pensionAmount_${idx}" inputmode="decimal" autocomplete="off" form="form161">
    </div>
    <div class="grant-total-stack prp-total-stack">
        <span class="grant-field-label">הסכום הכולל שעל בסיסו חושבה הקצבה</span>
        <input type="text" class="grant-money-input" name="conversionAmountBalance_${idx}" inputmode="decimal" autocomplete="off" form="form161">
    </div>
</div>
<button type="button" class="btn btn-remove grant-remove-btn" onclick="removePreRetirementPension(${idx})">מחק</button>
`;
    list.appendChild(card);
    initPreRetirementPensionRow(card, idx);
    preRetirementPensionCounter++;
    refreshA9ToA11Totals();
}

function initPreRetirementPensionRow(card, idx) {
    const payerName = card.querySelector('input[name="preRetirementPayerName_' + idx + '"]');
    const deduction = card.querySelector('input[name="preRetirementPayerDeductionFile_' + idx + '"]');
    const payerType = card.querySelector('select[name="preRetirementPayerTypeCode_' + idx + '"]');
    const pensionAmount = card.querySelector('input[name="pensionAmount_' + idx + '"]');
    const conversionAmountBalance = card.querySelector('input[name="conversionAmountBalance_' + idx + '"]');

    initAdaptiveTextInput(payerName);
    initDeductionFileNinePrefixControl(deduction);
    if (deduction) {
        deduction.addEventListener('blur', function () {
            const v = stripSalaryDigits(this.value);
            const err = this.parentElement.querySelector('.error-message');
            this.classList.remove('error');
            if (err) err.style.display = 'none';
            if (v.length > 0 && !/^9\d{8}$/.test(v)) {
                this.classList.add('error');
                if (err) err.style.display = 'block';
            }
        });
    }
    initPayerTypeSelect(payerType);
    initMoneyFormattedInput(pensionAmount);
    initMoneyFormattedInput(conversionAmountBalance);
    [pensionAmount, conversionAmountBalance].forEach(inp => {
        if (!inp) return;
        inp.addEventListener('input', refreshA9ToA11Totals);
        inp.addEventListener('blur', refreshA9ToA11Totals);
    });
}

// Remove pre-retirement pension row
function removePreRetirementPension(id) {
    const row = document.getElementById(`preRetirementPension_${id}`);
    if (row) {
        row.remove();
        refreshA9ToA11Totals();
    }
}

// Validate XML data against XSD requirements
function validateXMLData(formData) {
    const errors = [];
    
    // Required fields validation
    if (!formData.get('employerDeductionFile') || !formData.get('employerDeductionFile').match(/^9\d{8}$/)) {
        errors.push('מספר תיק ניכויים מעסיק הוא שדה חובה (9 ספרות המתחילות ב-9)');
    }
    
    if (hasOnlyOneOfPrefixAndPhone(formData.get('contactPhonePrefix'), formData.get('contactPhoneNumber'))) {
        errors.push('בחלק א.2: יש למלא גם קידומת וגם מספר טלפון נייד, או להשאיר את שניהם ריקים');
    }
    
    if (!formData.get('employeeIdNumber') || formData.get('employeeIdNumber').length !== 9) {
        errors.push('מספר זהות עובד הוא שדה חובה (9 ספרות)');
    }
    
    if (!formData.get('firstName') || formData.get('firstName').length < 2 || formData.get('firstName').length > 30) {
        errors.push('שם פרטי הוא שדה חובה (2-30 תווים)');
    }
    
    if (!formData.get('lastName') || formData.get('lastName').length < 2 || formData.get('lastName').length > 30) {
        errors.push('שם משפחה הוא שדה חובה (2-30 תווים)');
    }
    
    if (!formData.get('retirementReason')) {
        errors.push('סיבת פרישה היא שדה חובה');
    }
    
    if (!formData.get('employmentStartDate')) {
        errors.push('תאריך התחלת העבודה הוא שדה חובה');
    }
    
    if (!formData.get('employmentRetirementDate')) {
        errors.push('תאריך פרישה הוא שדה חובה');
    }
    
    const fullSal = salaryIntFromFormData(formData, 'fullLastSalaryBeforeRetirement');
    if (isNaN(fullSal) || fullSal < 1) {
        errors.push('משכורת חודשית אחרונה מלאה לפני הפרישה היא שדה חובה (סכום תקין)');
    }

    const lastInsSal = salaryIntFromFormData(formData, 'lastInsuredSalary');
    if (isNaN(lastInsSal) || lastInsSal < 1) {
        errors.push('משכורת מבוטחת אחרונה היא שדה חובה (סכום תקין)');
    }

    const sevSal = salaryIntFromFormData(formData, 'severanceSalary');
    if (isNaN(sevSal) || sevSal < 1) {
        errors.push('שכר עבודה לחבות פיצויים הוא שדה חובה (סכום תקין)');
    }
    
    // Validate NonTaxExemptGrants - must have at least one grant
    const nonTaxExemptGrantsBody = document.getElementById('nonTaxExemptGrantsBody');
    const nonTaxExemptGrantRows = nonTaxExemptGrantsBody ? nonTaxExemptGrantsBody.querySelectorAll('.grant-card') : [];
    if (!nonTaxExemptGrantsBody || nonTaxExemptGrantRows.length === 0) {
        errors.push('חובה למלא לפחות מענק אחד בחלק א.9 - מענקים לא חויבו במס');
    }
    
    return errors;
}

// Generate XML from form data
function generateXML() {
    const form = document.getElementById('form161');
    const formData = new FormData(form);

    // Validate data before generating XML
    const validationErrors = validateXMLData(formData);
    if (validationErrors.length > 0) {
        showAppAlert('שגיאות ולידציה:\n' + validationErrors.join('\n'));
        return;
    }

    // Build XML string directly
    let xml = '<?xml version="1.0" encoding="utf-8"?>\n';
    xml += '<EmploymentTerminationInterface xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema">\n';

    xml += '  <InterfaceBody>\n';
    xml += '    <AddressingEntity>\n';
    xml += '      <EmployerDetails>\n';
    
    let employerDeductionFile = formData.get('employerDeductionFile') || '';
    // Ensure it starts with 9 and has 9 digits
    if (!employerDeductionFile.startsWith('9')) {
        employerDeductionFile = '9' + employerDeductionFile.replace(/^9+/, '');
    }
    if (employerDeductionFile.length < 9) {
        employerDeductionFile = employerDeductionFile.padEnd(9, '0');
    }
    xml += '        <EmployerDeductionFileNumber>' + escapeXML(employerDeductionFile) + '</EmployerDeductionFileNumber>\n';
    const contactPhonePrefix = formData.get('contactPhonePrefix');
    const contactPhoneNumber = formData.get('contactPhoneNumber');
    let contactMobileNumber = '';
    if (hasOnlyOneOfPrefixAndPhone(contactPhonePrefix, contactPhoneNumber)) {
        showAppAlert('בחלק א.2: יש למלא גם קידומת וגם מספר טלפון נייד, או להשאיר את שניהם ריקים.');
        return;
    } else if (contactPhonePrefix && contactPhoneNumber) {
        contactMobileNumber = contactPhonePrefix + contactPhoneNumber;
    }
    if (contactMobileNumber) {
        xml += '        <ContactMobileNumber>' + escapeXML(contactMobileNumber) + '</ContactMobileNumber>\n';
    }
    const contactEmail = formData.get('contactEmail');
    if (contactEmail && contactEmail.trim()) {
        xml += '        <ContactEmail>' + escapeXML(contactEmail) + '</ContactEmail>\n';
    }
    
    xml += '        <EmployeeList>\n';
    xml += '          <EmployeeDetails>\n';
    
    // Part A.1 - Employee Details
    const employeeIdNumber = formData.get('employeeIdNumber') || '';
    if (!employeeIdNumber || employeeIdNumber.length !== 9) {
        showAppAlert('מספר זהות עובד הוא שדה חובה (9 ספרות)');
        return;
    }
    xml += '            <EmployeeIdNumber>' + escapeXML(employeeIdNumber) + '</EmployeeIdNumber>\n';
    
    const firstName = formData.get('firstName') || '';
    if (!firstName || firstName.length < 2 || firstName.length > 30) {
        showAppAlert('שם פרטי הוא שדה חובה (2-30 תווים)');
        return;
    }
    xml += '            <FirstName>' + escapeXML(firstName) + '</FirstName>\n';
    
    const lastName = formData.get('lastName') || '';
    if (!lastName || lastName.length < 2 || lastName.length > 30) {
        showAppAlert('שם משפחה הוא שדה חובה (2-30 תווים)');
        return;
    }
    xml += '            <LastName>' + escapeXML(lastName) + '</LastName>\n';
    
    xml += '            <EmployeeContactDetails>\n';
    const employeePhonePrefix = formData.get('employeePhonePrefix');
    const employeePhoneNumber = formData.get('employeePhoneNumber');
    if (employeePhonePrefix && employeePhoneNumber) {
        const fullPhoneNumber = employeePhonePrefix + employeePhoneNumber;
        xml += '              <EmployeeMobileNumber>' + escapeXML(fullPhoneNumber) + '</EmployeeMobileNumber>\n';
    } else if (employeePhoneNumber) {
        // If only number provided without prefix, use as is
        xml += '              <EmployeeMobileNumber>' + escapeXML(employeePhoneNumber) + '</EmployeeMobileNumber>\n';
    }
    const employeeEmail = formData.get('employeeEmail');
    if (employeeEmail && employeeEmail.trim()) {
        xml += '              <EmployeeEmail>' + escapeXML(employeeEmail) + '</EmployeeEmail>\n';
    }
    xml += '            </EmployeeContactDetails>\n';
    
    const { holderOfControlling, relativeOfControlling } = getControllingInterestValues();
    xml += '            <HolderOfControllingInterest>' + holderOfControlling + '</HolderOfControllingInterest>\n';
    xml += '            <RelativeHolderOfControllingInterest>' + relativeOfControlling + '</RelativeHolderOfControllingInterest>\n';
    
    // RelationshipType - only if RelativeHolderOfControllingInterest = 1
    if (relativeOfControlling === '1') {
        const relationshipType = formData.get('relationshipType');
        if (relationshipType) {
            xml += '            <RelationshipType>' + escapeXML(relationshipType) + '</RelationshipType>\n';
        }
    }
    
    // Part A.3 - Retirement Reason
    const retirementReason = formData.get('retirementReason');
    if (!retirementReason) {
        showAppAlert('סיבת פרישה היא שדה חובה');
        return;
    }
    xml += '            <RetirmentReason>' + escapeXML(retirementReason) + '</RetirmentReason>\n';
    
    // Part A.4 - Employment Period
    const employmentStartDate = formData.get('employmentStartDate');
    const employmentRetirementDate = formData.get('employmentRetirementDate');
    if (!employmentStartDate || !employmentRetirementDate) {
        showAppAlert('תאריכי תקופת העבודה הם שדות חובה');
        return;
    }
    xml += '            <EmploymentPeriod>\n';
    xml += '              <EmploymentStartDate>' + formatDateYYYYMMDD(employmentStartDate) + '</EmploymentStartDate>\n';
    xml += '              <EmploymentRetirementDate>' + formatDateYYYYMMDD(employmentRetirementDate) + '</EmploymentRetirementDate>\n';
    xml += '            </EmploymentPeriod>\n';

    // Part A.5 - Non-consecutive work periods
    const workPeriodsBody = document.getElementById('workPeriodsBody');
    const workPeriodRows = workPeriodsBody.querySelectorAll('tr');
    if (workPeriodRows.length > 0) {
        xml += '            <NonConsecutiveWorkPeriods>\n';
        workPeriodRows.forEach(row => {
            const startDateInput = row.querySelector('input[name^="workPeriodStartDate"]');
            const endDateInput = row.querySelector('input[name^="workPeriodEndDate"]');
            const rateInput = row.querySelector('input[name^="workPeriodEmploymentRate"]');
            const salaryInput = row.querySelector('input[name^="workPeriodLastSalary"]');

            if (startDateInput && startDateInput.value && endDateInput && endDateInput.value) {
                xml += '              <WorkPeriod>\n';
                xml += '                <WorkPeriodStartDate>' + formatDateYYYYMMDD(startDateInput.value) + '</WorkPeriodStartDate>\n';
                xml += '                <WorkPeriodEndDate>' + formatDateYYYYMMDD(endDateInput.value) + '</WorkPeriodEndDate>\n';
                if (rateInput && rateInput.value) {
                    xml += '                <WorkPeriodEmploymentRate>' + escapeXML(rateInput.value) + '</WorkPeriodEmploymentRate>\n';
                }
                if (salaryInput && salaryInput.value) {
                    xml += '                <WorkPeriodLastSalary>' + escapeXML(salaryInput.value) + '</WorkPeriodLastSalary>\n';
                }
                xml += '              </WorkPeriod>\n';
            }
        });
        xml += '            </NonConsecutiveWorkPeriods>\n';
    }

    // Part A.6 - Salary (all required fields; מוצג עם פסיקים, ב־XML רק ספרות)
    const fullLastSalaryInt = salaryIntFromFormData(formData, 'fullLastSalaryBeforeRetirement');
    if (isNaN(fullLastSalaryInt) || fullLastSalaryInt < 1) {
        showAppAlert('משכורת חודשית אחרונה מלאה לפני הפרישה היא שדה חובה');
        return;
    }
    xml += '            <FullLastSalaryBeforeRetirement>' + escapeXML(moneyForXml(fullLastSalaryInt)) + '</FullLastSalaryBeforeRetirement>\n';

    const lastInsuredSalaryInt = salaryIntFromFormData(formData, 'lastInsuredSalary');
    if (isNaN(lastInsuredSalaryInt) || lastInsuredSalaryInt < 1) {
        showAppAlert('משכורת מבוטחת אחרונה היא שדה חובה');
        return;
    }
    xml += '            <LastInsuredSalary>' + escapeXML(moneyForXml(lastInsuredSalaryInt)) + '</LastInsuredSalary>\n';

    const severanceSalaryInt = salaryIntFromFormData(formData, 'severanceSalary');
    if (isNaN(severanceSalaryInt) || severanceSalaryInt < 1) {
        showAppAlert('שכר עבודה לחבות פיצויים הוא שדה חובה');
        return;
    }
    xml += '            <SeveranceSalary>' + escapeXML(moneyForXml(severanceSalaryInt)) + '</SeveranceSalary>\n';

    // Part A.7 - Budgetary Pension
    const budgetaryPensionOption = formData.get('budgetaryPensionOption');
    if (budgetaryPensionOption === 'entitled') {
        xml += '            <BudgetaryPension>\n';
        xml += '              <EntitlementDate>' + formatDateYYYYMMDD(formData.get('entitlementDate')) + '</EntitlementDate>\n';
        xml += '              <SalaryForBudgetaryPensionCalculation>' + escapeXML(formData.get('salaryForBudgetaryPensionCalculation')) + '</SalaryForBudgetaryPensionCalculation>\n';
        xml += '            </BudgetaryPension>\n';
    }

    // Part A.8 - Retirement Installments Grant
    const installmentsBody = document.getElementById('installmentsBody');
    const installmentRows = installmentsBody.querySelectorAll('tr');
    if (installmentRows.length > 0) {
        xml += '            <RetirementInstallmentsGrant>\n';
        installmentRows.forEach(row => {
            const yearInput = row.querySelector('input[name^="paymentTaxYear"]');
            const amountInput = row.querySelector('input[name^="paymentAmount"]');

            if (yearInput && yearInput.value && amountInput && amountInput.value) {
                const rawPay = String(yearInput.value).trim();
                const payYearXml = /^\d{4}-\d{2}-\d{2}$/.test(rawPay)
                    ? formatDateYYYY(rawPay)
                    : escapeXML(rawPay.substring(0, 4));
                xml += '              <Grant>\n';
                xml += '                <PaymentTaxYear>' + payYearXml + '</PaymentTaxYear>\n';
                xml += '                <PaymentAmount>' + escapeXML(amountInput.value) + '</PaymentAmount>\n';
                xml += '              </Grant>\n';
            }
        });
        xml += '            </RetirementInstallmentsGrant>\n';
    }

    // Part A.9 - Non-tax exempt grants (required - minOccurs=1)
    const nonTaxExemptGrantsBody = document.getElementById('nonTaxExemptGrantsBody');
    const nonTaxExemptGrantRows = nonTaxExemptGrantsBody ? nonTaxExemptGrantsBody.querySelectorAll('.grant-card') : [];
    if (nonTaxExemptGrantRows.length === 0) {
        showAppAlert('חובה למלא לפחות מענק אחד בחלק א.9 - מענקים לא חויבו במס');
        return;
    }
    
    xml += '            <NonTaxExemptGrants>\n';
    let validGrantsCount = 0;
    nonTaxExemptGrantRows.forEach(row => {
        const payerName = row.querySelector('input[name^="payerName"]');
        const payerDeductionFile = row.querySelector('input[name^="payerDeductionFile"]');
        const payerTypeCode = row.querySelector('select[name^="payerTypeCode"]');
        const paymentType = row.querySelector('select[name^="paymentType"]');
        const firstDepositDate = row.querySelector('input[name^="firstDepositDate"]');
        const lastDepositDate = row.querySelector('input[name^="lastDepositDate"]');
        const amountForRetirementDay = row.querySelector('input[name^="amountForRetirementDay"]');
        const additionalAccumulation = row.querySelector('input[name^="additionalAccumulation"]');

        if (payerName && payerName.value && payerDeductionFile && payerDeductionFile.value) {
            // Validate required fields
            if (!payerTypeCode || !payerTypeCode.value) {
                showAppAlert('קוד המשלם הוא שדה חובה בכל שורה בחלק א.9');
                return;
            }
            if (!paymentType || !paymentType.value) {
                showAppAlert('סוג התשלום הוא שדה חובה בכל שורה בחלק א.9');
                return;
            }
            if (!firstDepositDate || !firstDepositDate.value) {
                showAppAlert('תאריך הפקדה ראשון הוא שדה חובה בכל שורה בחלק א.9');
                return;
            }
            const amtVal = amountForRetirementDay ? parseMoneyFormatted(amountForRetirementDay.value) : NaN;
            if (!amountForRetirementDay || isNaN(amtVal) || amtVal < 1) {
                showAppAlert('הסכום ליום הפרישה הוא שדה חובה בכל שורה בחלק א.9');
                return;
            }
            const dedDigits = stripSalaryDigits(payerDeductionFile.value);
            if (!dedDigits.match(/^9\d{8}$/)) {
                showAppAlert('תיק ניכויים משלם חייב להיות 9 ספרות המתחילות ב־9 (שורה בחלק א.9)');
                return;
            }

            xml += '              <Grant>\n';
            xml += '                <PayerName>' + escapeXML(payerName.value) + '</PayerName>\n';
            xml += '                <NonTaxExemptPayerDeductionFileNumber>' + escapeXML(dedDigits) + '</NonTaxExemptPayerDeductionFileNumber>\n';
            xml += '                <PayerTypeCode>' + escapeXML(payerTypeCode.value) + '</PayerTypeCode>\n';
            xml += '                <PaymentType>' + escapeXML(paymentType.value) + '</PaymentType>\n';
            xml += '                <FirstDepositDate>' + formatDateYYYYMMDD(firstDepositDate.value) + '</FirstDepositDate>\n';
            if (lastDepositDate && lastDepositDate.value) {
                xml += '                <LastDepositDate>' + formatDateYYYYMMDD(lastDepositDate.value) + '</LastDepositDate>\n';
            }
            xml += '                <AmountForRetirementDay>' + escapeXML(moneyForXml(amtVal)) + '</AmountForRetirementDay>\n';
            const addVal = additionalAccumulation ? parseMoneyFormatted(additionalAccumulation.value) : 0;
            if (!isNaN(addVal) && addVal > 0) {
                xml += '                <AdditionalAccumulation>' + escapeXML(moneyForXml(addVal)) + '</AdditionalAccumulation>\n';
            }
            xml += '              </Grant>\n';
            validGrantsCount++;
        }
    });
    
    if (validGrantsCount === 0) {
        showAppAlert('חובה למלא לפחות מענק אחד תקין בחלק א.9 - מענקים לא חויבו במס');
        return;
    }
    
    xml += '            </NonTaxExemptGrants>\n';

    // Part A.10 - Tax exempt grants
    const taxExemptOption = formData.get('taxExemptOption');
    if (taxExemptOption === 'yes') {
        const taxExemptGrantsBody = document.getElementById('taxExemptGrantsBody');
        const taxExemptGrantRows = taxExemptGrantsBody.querySelectorAll('tr');
        if (taxExemptGrantRows.length > 0) {
            xml += '            <TaxExemptGrants>\n';
            taxExemptGrantRows.forEach(row => {
                const payerName = row.querySelector('input[name^="taxExemptPayerName"]');
                const payerDeductionFile = row.querySelector('input[name^="taxExemptPayerDeductionFile"]');
                const nominalAmount = row.querySelector('input[name^="nominalDeductiblePaymentAmount"]');
                const realAmount = row.querySelector('input[name^="realDeductiblePaymentAmount"]');

                if (payerName && payerName.value && payerDeductionFile && payerDeductionFile.value && nominalAmount && nominalAmount.value) {
                    const taxDeductionDigits = stripSalaryDigits(payerDeductionFile.value);
                    const nominalValue = parseMoneyFormatted(nominalAmount.value);
                    const realValue = realAmount ? parseMoneyFormatted(realAmount.value) : NaN;
                    if (!/^9\d{8}$/.test(taxDeductionDigits)) {
                        showAppAlert('תיק ניכויים משלם בחלק א.10 חייב להיות 9 ספרות המתחילות ב־9');
                        return;
                    }
                    if (isNaN(nominalValue) || nominalValue < 1) {
                        showAppAlert('התשלומים שחויבו במס (נומינלי) בחלק א.10 חייבים להיות סכום תקין');
                        return;
                    }

                    xml += '              <Grant>\n';
                    xml += '                <PayerName>' + escapeXML(payerName.value) + '</PayerName>\n';
                    xml += '                <TaxExemptPayerDeductionFileNumber>' + escapeXML(taxDeductionDigits) + '</TaxExemptPayerDeductionFileNumber>\n';
                    xml += '                <NominalDeductiblePaymentAmount>' + escapeXML(moneyForXml(nominalValue)) + '</NominalDeductiblePaymentAmount>\n';
                    if (realAmount && realAmount.value && !isNaN(realValue)) {
                        xml += '                <RealDeductiblePaymentAmount>' + escapeXML(moneyForXml(realValue)) + '</RealDeductiblePaymentAmount>\n';
                    }
                    xml += '              </Grant>\n';
                }
            });
            xml += '            </TaxExemptGrants>\n';
        }
    }

    // Part A.11 - Pre-retirement pension
    const preRetirementPensionBody = document.getElementById('preRetirementPensionBody');
    const preRetirementPensionRows = preRetirementPensionBody
        ? preRetirementPensionBody.querySelectorAll('.prp-grant-card')
        : [];
    if (preRetirementPensionRows.length > 0) {
        const grantXmlChunks = [];
        let partialPreRetirementRow = false;
        let preRetirementAmountRangeError = false;
        preRetirementPensionRows.forEach(row => {
            const payerName = row.querySelector('input[name^="preRetirementPayerName"]');
            const payerDeductionFile = row.querySelector('input[name^="preRetirementPayerDeductionFile"]');
            const payerTypeCode = row.querySelector('select[name^="preRetirementPayerTypeCode"]');
            const pensionConversionDate = row.querySelector('input[name^="pensionConversionDate"]');
            const pensionAmount = row.querySelector('input[name^="pensionAmount"]');
            const conversionAmountBalance = row.querySelector('input[name^="conversionAmountBalance"]');

            const nameTrim = payerName && String(payerName.value || '').trim();
            const fileDigits = payerDeductionFile ? stripSalaryDigits(payerDeductionFile.value) : '';
            const typeVal = payerTypeCode && String(payerTypeCode.value || '').trim();
            const convDate = pensionConversionDate && String(pensionConversionDate.value || '').trim();
            const pa = pensionAmount ? parseMoneyFormatted(pensionAmount.value) : NaN;
            const cb = conversionAmountBalance ? parseMoneyFormatted(conversionAmountBalance.value) : NaN;

            const any =
                nameTrim ||
                fileDigits ||
                typeVal ||
                convDate ||
                (pensionAmount && String(pensionAmount.value || '').trim() !== '') ||
                (conversionAmountBalance && String(conversionAmountBalance.value || '').trim() !== '');
            if (!any) {
                return;
            }

            const complete =
                nameTrim &&
                /^9\d{8}$/.test(fileDigits) &&
                (typeVal === '5' || typeVal === '6') &&
                convDate &&
                !isNaN(pa) &&
                pa >= 1 &&
                !isNaN(cb) &&
                cb >= 1;

            if (!complete) {
                partialPreRetirementRow = true;
                return;
            }

            const paInt = Math.round(pa);
            const cbInt = Math.round(cb);
            if (paInt > 999999 || cbInt > 999999999) {
                preRetirementAmountRangeError = true;
                return;
            }
            let chunk = '              <Grant>\n';
            chunk += '                <PayerName>' + escapeXML(nameTrim) + '</PayerName>\n';
            chunk += '                <PreRetirementPensionPayerDeductionFileNumber>' + escapeXML(fileDigits) + '</PreRetirementPensionPayerDeductionFileNumber>\n';
            chunk += '                <PayerTypeCode>' + escapeXML(typeVal) + '</PayerTypeCode>\n';
            chunk += '                <PensionConversionDate>' + formatDateYYYYMMDD(convDate) + '</PensionConversionDate>\n';
            chunk += '                <PensionAmount>' + escapeXML(String(paInt)) + '</PensionAmount>\n';
            chunk += '                <ConvertionAmountBallance>' + escapeXML(String(cbInt)) + '</ConvertionAmountBallance>\n';
            chunk += '              </Grant>\n';
            grantXmlChunks.push(chunk);
        });

        if (preRetirementAmountRangeError) {
            showAppAlert('בחלק א.11: סכום הקצבה עד 999,999 והסכום הכולל עד 999,999,999 (לפי הסכימה).');
            return;
        }
        if (partialPreRetirementRow) {
            showAppAlert('בחלק א.11 יש שורה עם נתונים חלקיים — השלימו את כל השדות או מחקו את השורה.');
            return;
        }
        if (grantXmlChunks.length > 0) {
            xml += '            <PreRetirementPension>\n';
            grantXmlChunks.forEach(c => { xml += c; });
            xml += '            </PreRetirementPension>\n';
        }
    }

    // Close XML structure
    xml += '          </EmployeeDetails>\n';
    xml += '        </EmployeeList>\n';
    xml += '      </EmployerDetails>\n';
    xml += '    </AddressingEntity>\n';
    xml += '  </InterfaceBody>\n';
    xml += '</EmploymentTerminationInterface>';

    // Download XML file
    downloadXML(xml);
}

function setupEmploymentPeriodAutoFill() {
    const startEl = document.getElementById('employmentStartDate');
    const endEl = document.getElementById('employmentRetirementDate');
    if (!startEl || !endEl) return;

    const refresh = () => calculateEmploymentPeriod();
    // רק change — תאריך מלא נקבע לאחר בחירה/סיום עריכה; לא מחשבים בזמן הקלדה חלקית
    startEl.addEventListener('change', refresh);
    endEl.addEventListener('change', refresh);
    refresh();
}

// Calculate employment period based on dates (read-only fields): ימים מלאים, שנים שלמות, חלקי שנה = (יתרה/365) מעוגל ל־3 ספרות אחרי הנקודה
function calculateEmploymentPeriod() {
    const daysField = document.getElementById('employmentPeriodDays');
    const yearsField = document.getElementById('employmentPeriodYears');
    const partialField = document.getElementById('employmentPeriodPartialYears');
    if (!daysField || !yearsField || !partialField) return;

    const startDate = document.getElementById('employmentStartDate').value.trim();
    const endDate = document.getElementById('employmentRetirementDate').value.trim();
    const dateComplete = (v) => /^\d{4}-\d{2}-\d{2}$/.test(v);

    if (!dateComplete(startDate) || !dateComplete(endDate)) {
        daysField.value = '';
        yearsField.value = '';
        partialField.value = '';
        return;
    }

    const start = new Date(startDate + 'T00:00:00');
    const end = new Date(endDate + 'T00:00:00');

    if (start > end) {
        daysField.value = '';
        yearsField.value = '';
        partialField.value = '';
        return;
    }

    const diffTime = end - start;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    const fullYears = Math.floor(diffDays / 365);
    const partialRaw = (diffDays % 365) / 365;
    const partialYears = Math.round(partialRaw * 1000) / 1000;

    daysField.value = String(diffDays);
    yearsField.value = String(fullYears);
    partialField.value = partialYears === 0 ? '0' : String(partialYears);
}

function setupOperationPanel() {
    const panel = document.getElementById('operationPanel');
    const header = document.getElementById('operationPanelHeader');
    const toggle = document.getElementById('operationPanelToggle');
    const saveBtn = document.getElementById('saveJsonBtn');
    const loadBtn = document.getElementById('loadJsonBtn');
    const loadInput = document.getElementById('loadJsonInput');
    const pdfBtn = document.getElementById('savePdfBtn');
    const resetBtn = document.getElementById('resetFormBtn');
    if (!panel || !header || !toggle) return;

    function setCollapsed(collapsed) {
        panel.classList.toggle('collapsed', collapsed);
        header.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
    }

    function togglePanel() {
        setCollapsed(!panel.classList.contains('collapsed'));
    }

    header.addEventListener('click', function (event) {
        if (event.target === toggle || toggle.contains(event.target)) {
            return;
        }
        togglePanel();
    });

    header.addEventListener('keydown', function (event) {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            togglePanel();
        }
    });

    toggle.addEventListener('click', function (event) {
        event.stopPropagation();
        togglePanel();
    });

    if (saveBtn) {
        saveBtn.addEventListener('click', function (event) {
            event.preventDefault();
            event.stopPropagation();
            saveFormStateToJson();
        });
    }

    if (loadBtn && loadInput) {
        loadBtn.addEventListener('click', function () {
            loadInput.click();
        });
        loadInput.addEventListener('change', handleJsonFileImport);
    }

    if (pdfBtn) {
        pdfBtn.addEventListener('click', generatePDF);
    }

    if (resetBtn) {
        resetBtn.addEventListener('click', resetFormCompletely);
    }
}

function isFormMeaningfullyEmpty() {
    const form = document.getElementById('form161');
    if (!form) return true;

    const ignoredDefaultIds = new Set([
        'formTypeOriginal',
        'budgetaryPensionNone',
        'taxExemptNo'
    ]);

    const fields = form.querySelectorAll('input, select, textarea');
    for (const field of fields) {
        if (!field.name && !field.id) continue;
        if (field.type === 'hidden' || field.type === 'submit' || field.type === 'button') continue;
        if (field.readOnly && field.classList.contains('grant-total-input')) continue;
        if (ignoredDefaultIds.has(field.id)) continue;

        if (field.type === 'checkbox' || field.type === 'radio') {
            if (field.checked) {
                return false;
            }
            continue;
        }

        if (field.tagName === 'SELECT') {
            if (String(field.value || '').trim() !== '') {
                return false;
            }
            continue;
        }

        if (String(field.value || '').trim() !== '') {
            return false;
        }
    }

    return true;
}

function buildJsonSnapshot() {
    const form = document.getElementById('form161');
    const fields = {};
    const handledRadioNames = new Set();

    form.querySelectorAll('input, select, textarea').forEach(field => {
        const key = field.name || field.id;
        if (!key || field.type === 'submit' || field.type === 'button') return;

        if (field.type === 'radio') {
            if (handledRadioNames.has(key)) return;
            handledRadioNames.add(key);

            const group = form.querySelectorAll(`input[type="radio"][name="${field.name}"]`);
            const checkedField = Array.from(group).find(radio => radio.checked);
            fields[key] = {
                type: 'radio-group',
                value: checkedField ? checkedField.value : ''
            };
            return;
        }

        if (field.type === 'checkbox') {
            fields[key] = {
                type: field.type,
                checked: field.checked,
                value: field.value
            };
            return;
        }

        fields[key] = {
            type: field.tagName.toLowerCase(),
            value: field.value
        };
    });

    return {
        schemaVersion: 1,
        formType: '161-part-a',
        savedAt: new Date().toISOString(),
        employeeIdNumber: document.getElementById('employeeIdNumber')?.value || '',
        fields
    };
}

function saveFormStateToJson() {
    if (isFormMeaningfullyEmpty()) {
        showAppAlert('לא ניתן לשמור קובץ JSON כאשר כל שדות הטופס ריקים');
        return;
    }

    const employeeId = String(document.getElementById('employeeIdNumber')?.value || '').trim();
    if (!isValidIsraeliId(employeeId)) {
        showAppAlert('לא ניתן לשמור קובץ. יש למלא בחלק א.1 מספר זהות ישראלי תקין לפני שמירה');
        return;
    }

    const snapshot = buildJsonSnapshot();
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `161_${employeeId}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showAppAlert('קובץ JSON נשמר בהצלחה', { icon: 'success', title: 'השמירה הושלמה' });
}

function validateJsonSnapshotStructure(snapshot) {
    if (!snapshot || typeof snapshot !== 'object' || Array.isArray(snapshot)) {
        return 'קובץ JSON אינו אובייקט תקין';
    }
    if (snapshot.schemaVersion !== 1) {
        return 'schemaVersion אינו נתמך';
    }
    if (snapshot.formType !== '161-part-a') {
        return 'הקובץ אינו שייך לחלק א׳ של טופס 161';
    }
    if (!snapshot.fields || typeof snapshot.fields !== 'object' || Array.isArray(snapshot.fields)) {
        return 'לא נמצא שדה fields במבנה תקין';
    }

    for (const [key, descriptor] of Object.entries(snapshot.fields)) {
        if (!descriptor || typeof descriptor !== 'object' || Array.isArray(descriptor)) {
            return `השדה ${key} אינו במבנה תקין`;
        }
        if (descriptor.type === 'radio-group') {
            if (typeof descriptor.value !== 'string') {
                return `השדה ${key} חסר value מסוג מחרוזת`;
            }
            continue;
        }
        if (descriptor.type === 'checkbox' || descriptor.type === 'radio') {
            if (typeof descriptor.checked !== 'boolean') {
                return `השדה ${key} חסר checked תקין`;
            }
            continue;
        }
        if (typeof descriptor.value !== 'string') {
            return `השדה ${key} חסר value מסוג מחרוזת`;
        }
    }

    return null;
}

function resetFormForImport() {
    const form = document.getElementById('form161');
    if (!form) return;

    form.reset();

    const workPeriodsBody = document.getElementById('workPeriodsBody');
    const installmentsBody = document.getElementById('installmentsBody');
    const nonTaxExemptGrantsBody = document.getElementById('nonTaxExemptGrantsBody');
    const taxExemptGrantsBody = document.getElementById('taxExemptGrantsBody');
    const preRetirementPensionBody = document.getElementById('preRetirementPensionBody');

    if (workPeriodsBody) workPeriodsBody.innerHTML = '';
    if (installmentsBody) installmentsBody.innerHTML = '';
    if (nonTaxExemptGrantsBody) nonTaxExemptGrantsBody.innerHTML = '';
    if (taxExemptGrantsBody) taxExemptGrantsBody.innerHTML = '';
    if (preRetirementPensionBody) preRetirementPensionBody.innerHTML = '';

    workPeriodCounter = 0;
    installmentCounter = 0;
    nonTaxExemptGrantCounter = 0;
    taxExemptGrantCounter = 0;
    preRetirementPensionCounter = 0;

    document.querySelectorAll('.error').forEach(el => el.classList.remove('error'));
    document.querySelectorAll('.error-message').forEach(el => { el.style.display = 'none'; });

    const previousFormDateContainer = document.getElementById('previousFormDateContainer');
    if (previousFormDateContainer) previousFormDateContainer.style.display = 'none';

    const relationshipTypeSelect = document.getElementById('relationshipType');
    if (relationshipTypeSelect) {
        relationshipTypeSelect.disabled = true;
        relationshipTypeSelect.value = '';
    }

    const budgetaryPensionDetails = document.getElementById('budgetaryPensionDetails');
    if (budgetaryPensionDetails) budgetaryPensionDetails.style.display = 'none';

    const taxExemptGrantsContainer = document.getElementById('taxExemptGrantsContainer');
    if (taxExemptGrantsContainer) taxExemptGrantsContainer.style.display = 'none';

    const uniformCheckbox = document.getElementById('uniformSalaryCheckbox');
    if (uniformCheckbox) {
        uniformCheckbox.checked = false;
        uniformCheckbox.dispatchEvent(new Event('change', { bubbles: true }));
    }

    calculateEmploymentPeriod();
    refreshA9ToA11Totals();
}

function ensureDynamicRowsFromSnapshot(fields) {
    const prefixMap = [
        { regex: /^workPeriodStartDate_(\d+)$/, add: addWorkPeriod, setCounter: value => { workPeriodCounter = value; } },
        { regex: /^paymentTaxYear_(\d+)$/, add: addInstallment, setCounter: value => { installmentCounter = value; } },
        { regex: /^payerName_(\d+)$/, add: addNonTaxExemptGrant, setCounter: value => { nonTaxExemptGrantCounter = value; } },
        { regex: /^taxExemptPayerName_(\d+)$/, add: addTaxExemptGrant, setCounter: value => { taxExemptGrantCounter = value; } },
        { regex: /^preRetirementPayerName_(\d+)$/, add: addPreRetirementPension, setCounter: value => { preRetirementPensionCounter = value; } }
    ];

    prefixMap.forEach(item => {
        let maxIndex = -1;
        Object.keys(fields).forEach(key => {
            const match = key.match(item.regex);
            if (match) {
                maxIndex = Math.max(maxIndex, parseInt(match[1], 10));
            }
        });
        for (let i = 0; i <= maxIndex; i++) {
            item.add();
        }
        item.setCounter(maxIndex + 1 > 0 ? maxIndex + 1 : 0);
    });
}

function applySnapshotToForm(snapshot) {
    const { fields } = snapshot;
    resetFormForImport();
    isApplyingSnapshot = true;
    try {
        ensureDynamicRowsFromSnapshot(fields);

        Object.entries(fields).forEach(([key, descriptor]) => {
            if (descriptor.type === 'radio-group') {
                const targetRadio = document.querySelector(`input[type="radio"][name="${key}"][value="${descriptor.value}"]`);
                if (targetRadio) {
                    targetRadio.checked = true;
                    targetRadio.dispatchEvent(new Event('change', { bubbles: true }));
                }
                return;
            }

            const field = document.querySelector(`[name="${key}"], #${CSS.escape(key)}`);
            if (!field) return;

            if (descriptor.type === 'checkbox' || descriptor.type === 'radio') {
                field.checked = !!descriptor.checked;
                field.dispatchEvent(new Event('change', { bubbles: true }));
                return;
            }

            field.value = descriptor.value || '';
            field.dispatchEvent(new Event('input', { bubbles: true }));
            field.dispatchEvent(new Event('change', { bubbles: true }));
            field.dispatchEvent(new Event('blur', { bubbles: true }));
        });

        normalizeInstallmentPaymentDateFields();
    } finally {
        isApplyingSnapshot = false;
    }

    calculateEmploymentPeriod();
    refreshA9ToA11Totals();
}

function handleJsonFileImport(event) {
    const input = event.target;
    const file = input.files && input.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function () {
        try {
            const snapshot = JSON.parse(String(reader.result || ''));
            const validationError = validateJsonSnapshotStructure(snapshot);
            if (validationError) {
                showAppAlert('לא ניתן לטעון את הקובץ: ' + validationError);
                input.value = '';
                return;
            }

            applySnapshotToForm(snapshot);
            showAppAlert('קובץ JSON נטען בהצלחה והטופס מולא מחדש', { icon: 'success', title: 'הטעינה הושלמה' });
        } catch (error) {
            console.error('Error loading JSON snapshot:', error);
            showAppAlert('קובץ JSON אינו תקין או שאינו ניתן לקריאה');
        } finally {
            input.value = '';
        }
    };
    reader.onerror = function () {
        showAppAlert('אירעה שגיאה בקריאת הקובץ');
        input.value = '';
    };
    reader.readAsText(file, 'utf-8');
}

function resetFormCompletely() {
    if (isFormMeaningfullyEmpty()) {
        showAppAlert('הטופס כבר מאופס', {
            icon: 'info',
            title: 'הודעה',
            toast: true,
            timer: 1000,
            showConfirmButton: false
        });
        return;
    }

    const proceed = () => window.location.reload();

    if (typeof Swal !== 'undefined' && Swal && typeof Swal.fire === 'function') {
        Swal.fire({
            icon: 'warning',
            title: 'לאפס את הטופס?',
            text: 'כל הנתונים שמולאו בדף יימחקו ולא ניתן יהיה לשחזר אותם.',
            showCancelButton: true,
            confirmButtonText: 'כן, אפס',
            cancelButtonText: 'ביטול',
            direction: 'rtl'
        }).then(result => {
            if (result.isConfirmed) {
                proceed();
            }
        });
        return;
    }

    if (window.confirm('כל נתוני הטופס יימחקו. להמשיך?')) {
        proceed();
    }
}

function generatePDF() {
    if (typeof html2pdf === 'undefined') {
        showAppAlert('ספריית יצירת PDF אינה זמינה כרגע');
        return;
    }

    const triggerButton = document.getElementById('savePdfBtn');
    const originalText = triggerButton ? triggerButton.textContent : '';
    if (triggerButton) {
        triggerButton.textContent = 'מייצר PDF...';
        triggerButton.disabled = true;
    }

    const formContainer = document.querySelector('.container');
    const stickyShell = document.querySelector('.sticky-top-shell');
    const previousPosition = stickyShell ? stickyShell.style.position : '';
    const previousTop = stickyShell ? stickyShell.style.top : '';

    if (stickyShell) {
        stickyShell.style.position = 'static';
        stickyShell.style.top = 'auto';
    }

    const options = {
        margin: [10, 10, 10, 10],
        filename: 'טופס_161_חלק_א_' + new Date().getTime() + '.pdf',
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

    html2pdf().set(options).from(formContainer).save().then(function() {
        if (stickyShell) {
            stickyShell.style.position = previousPosition;
            stickyShell.style.top = previousTop;
        }
        if (triggerButton) {
            triggerButton.textContent = originalText;
            triggerButton.disabled = false;
        }
        showAppAlert('קובץ PDF נוצר בהצלחה!', { icon: 'success', title: 'הפעולה הושלמה' });
    }).catch(function(error) {
        console.error('Error generating PDF:', error);
        if (stickyShell) {
            stickyShell.style.position = previousPosition;
            stickyShell.style.top = previousTop;
        }
        if (triggerButton) {
            triggerButton.textContent = originalText;
            triggerButton.disabled = false;
        }
        showAppAlert('שגיאה ביצירת PDF. נסה שוב.');
    });
}

// Escape XML special characters
function escapeXML(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}


// Download XML file
function downloadXML(xmlString) {
    const blob = new Blob([xmlString], { type: 'application/xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'form161_' + new Date().getTime() + '.xml';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    showAppAlert('קובץ XML נוצר בהצלחה!');
}

function showAppAlert(message, options = {}) {
    const config = {
        icon: options.icon || 'warning',
        title: options.title || 'הודעה',
        text: message,
        confirmButtonText: options.confirmButtonText || 'אישור',
        direction: 'rtl',
        toast: !!options.toast,
        timer: options.timer,
        timerProgressBar: !!options.timer,
        showConfirmButton: options.showConfirmButton !== undefined ? options.showConfirmButton : true,
        position: options.position || (options.toast ? 'top' : 'center')
    };

    if (typeof Swal !== 'undefined' && Swal && typeof Swal.fire === 'function') {
        return Swal.fire(config);
    }

    window.alert(message);
    return Promise.resolve();
}


