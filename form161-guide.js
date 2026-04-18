/**
 * מדריך למילוי ועזרים הקשריים לטופס 161 חלק א' (הודעת המעסיק).
 * תוכן מקצועי להנחיית ממלא — אינו מהווה ייעוץ משפטי/מס.
 */
(function () {
    'use strict';

    const GUIDE_STYLE_ID = 'form161-guide-styles';

    const SECTION_GUIDES = [
        {
            id: 'a1',
            title: 'א.1 — פרטי העובד',
            lead: 'זיהוי העובד והקשר לדיווח לרשות המיסים ולגופים מוסמכים. יש להתאים לפרטים הרשומים אצל המעסיק ובמסמכי שכר.',
            bullets: [
                'מספר זהות: תשע ספרות בלבד, ללא מקפים. מומלץ לוודא מול תעודת זהות.',
                'שם פרטי ומשפחה: כפי שמופיעים במערכות המעסיק (לרוב כמו בתעודת הזהות).',
                'כתובת ופרטי קשר: משפרים את היכולת ליצור קשר במקרה של פערים בדיווח — מלאו אם הם ידועים למעסיק.',
                'בעל שליטה / קרוב לבעל שליטה: שדות רגישות למס — סמנו רק אם חלים על העובד התנאים בהגדרות החוק.'
            ],
            tip: 'לאחר מילוי, עברו לחלק הבא רק כשכל שדות החובה בסעיף זה תקינים — כך תמנעו שגיאות בקובץ ה־XML ובמשלוח למערכות.'
        },
        {
            id: 'a2',
            title: 'א.2 — פרטי המעסיק',
            lead: 'זיהוי המעסיק ואיש הקשר הטכני להגשה. הנתונים חייבים להתאים לתיק הניכויים של המעסיק.',
            bullets: [
                'מספר תיק ניכויים: תשע ספרות המתחילות ב־9 — כפי שמופיע ברשות המיסים.',
                'טלפון איש קשר: נדרש למקרי בירור; הקפידו על מספר פעיל של גורם שמכיר את תיק העובד.',
                'דוא"ל איש קשר: אופציונלי אך מומלץ לזריזות תקשורת.'
            ],
            tip: 'אם הטופס מתוקן, ודאו שתאריך הטופס הקודם מדויק — זה עוזר לעקיבות בין גרסאות.'
        },
        {
            id: 'a3',
            title: 'א.3 — סיבת הפרישה',
            lead: 'הבחירה משפיעה על פרשנות זכויות ועל דיווחים נלווים. בחרו את הסיבה המדויקת ביותר לעובדה המשפטית.',
            bullets: [
                'יציאה לגימלאות / פיטורין / התפטרות — המקרה השכיח ביותר לפרישה רגילה.',
                'פטירה / נכות יציבה — מקרים מיוחדים; ודאו התאמה למסמכים רפואיים/משפטיים ככל שנדרש.'
            ],
            tip: 'במקרה של ספק משפטי בין סיבות, מומלץ להתייעץ עם יועץ שכר או משפטי לפני ההגשה.'
        },
        {
            id: 'a4',
            title: 'א.4 — תקופת העבודה',
            lead: 'תאריכי התחלה וסיום מגדירים את בסיס החישובים לפיצויים, קצבאות ומענקים. חייבים להיות עקביים עם הסכמי העבודה.',
            bullets: [
                'תאריך פרישה: בדרך כלל יום העזיבה האחרון או לפי ההגדרה בהסכם — לפי הנוהג אצלכם.',
                'שדות שנים/חלקי שנים/ימים: משלימים את התקופה; אם אינכם בטוחים, השוו לחישוב אוטומטי או למערכת שכר.',
                'חישוב השנים וחלקי השנים יהיה תוצאה של חלוקת הימים ב – 365.'
            ],
            tip: 'אם תאריך ההתחלה מאוחר מתאריך הפרישה, המערכת תחסום — זה מגן על נתונים לא הגיוניים.'
        },
        {
            id: 'a5',
            title: 'א.5 — תקופות לא רציפות / שינויי משרה / הפחתות שכר',
            lead: 'משמש כאשר היו מספר רצפי עבודה, שינויים בשיעור משרה או שינויי שכר בתוך אותה העסקה.',
            bullets: [
                'הוסיפו שורה לכל תקופה מהותית; השאירו ריק אם העבודה הייתה רציפה לחלוטין.',
                'שיעור משרה באחוזים ומשכורת אחרונה לתקופה — משקפים את המצב בפועל בסוף כל תקופה.'
            ],
            tip: 'אל תכפילו מידע שכבר משתקף בחלק א.4 אם אין שינוי אמיתי — פחות טעויות בביקורת נתונים.'
        },
        {
            id: 'a6',
            title: 'א.6 — משכורת העובד',
            lead: 'שלושת סכומי השכר משמשים לחישובי פיצויים ומס — חייבים לשקף את הגדרות המעסיק והחוק.',
            bullets: [
                'משכורת חודשית אחרונה מלאה: לרוב ברוטו לפני הפרישה, לפי הגדרת המערכת אצלכם.',
                'משכורת מבוטחת אחרונה: כפי שמדווחת לביטוח לאומי / קופות גמל — חשובה לעקביות.',
                'שכר לחבות פיצויים: בסיס לפיצויים — לעיתים שונה מהברוטו השוטף; ודאו מול מחלקת שכר.'
            ],
            tip: 'שמרו על עקביות בין הסכומים כאן לבין מסמכי שכר ותלושים — זה נקודת ביקורת נפוצה.'
        },
        {
            id: 'a7',
            title: 'א.7 — פנסיה תקציבית',
            lead: 'רלוונטי רק לעובדים הזכאים לפנסיה תקציבית ממעסיק או משלם מטעמו. אחרת סמנו "לא זכאי".',
            bullets: [
                'במקרה של זכאות — מלאו תאריך זכאות ומשכורת לחישוב, כפי שמופיע בהחלטות או במכתבי זכאות.',
                'אם אינכם בטוחים, אל תסמנו זכאות — עדיף לבדוק מול גורם מקצועי מאשר לדווח נתון שגוי.'
            ],
            tip: 'שדות הפנסיה התקציבית משפיעים על XML — השאירו ריקים כשאין זכאות.'
        },
        {
            id: 'a8',
            title: 'א.8 — מענקי פרישה לשיעורין לאחר הפרישה',
            lead: 'תשלומים עתידיים שאינם חלק מהמענק שחויב במס בשנות העבודה. עד שישה תשלומים.',
            bullets: [
                'כל שורה: שנת מס לתשלום וסכום — לפי התחייבויות או הסכמים חתומים.',
                'אל תכללו כאן סכומים שכבר דווחו כחייבים במס בתקופת העבודה — אלה שייכים לחלק אחר.'
            ],
            tip: 'אם אין מענקים לשיעורין — השאירו את הטבלה ריקה.'
        },
        {
            id: 'a9',
            title: 'א.9 — מענקים בגין תקופת העבודה (לא חויבו במס)',
            lead: 'חובה למלא לפחות מענק אחד תקין לפי הסכימה — זהו ליבת הדיווח לקופות ולמס.',
            bullets: [
                'כל משלם מוצג בכרטיס דו-שורתי (ללא גלילה אופקית), בדומה לטופס המודפס.',
                'תיק ניכויים משלם: 9 ספרות המתחילות ב־9 — אותה לוגיקה וולידציה כמו תיק הניכויים של המעסיק (א.2).',
                'סכומים: הזנה עם פסיק לאלפים ונקודה עשרונית; ב־XML נשמר ערך מספרי נקי.',
                'הסכום הכולל לרבות צבירה נוספת מחושב אוטומטית כחיבור הסכום ליום הפרישה וצבירה נוספת.'
            ],
            tip: 'לפני שליחת ה־XML, עברו שורה־שורה מול דוחות קופת גמל — זה חוסך תיקונים חוזרים.'
        },
        {
            id: 'a10',
            title: 'א.10 — הפקדות חויבו במס',
            lead: 'מיועד כאשר העובד כבר חויב במס על הפקדות פיצויים. אם לא — השאירו "לא חויב במס".',
            bullets: [
                'במקרה של "חויב במס" — הוסיפו שורות עם סכומים נומינליים וריאליים כנדרש.',
                'התאימו לתלושי שכר ולדוחות שנתיים — עקביות קריטית.'
            ],
            tip: 'אם אין הפקדות חייבות במס, אל תפעילו את הטבלה — זה מפשט את הקובץ.'
        },
        {
            id: 'a11',
            title: 'א.11 — קצבה טרם הפרישה',
            lead: 'קצבאות שהומרו לקצבה לפני פרישת העובד ממעסיק זה, לפי הרלוונטיות.',
            bullets: [
                'כל קצבה מוצגת בכרטיס (כמו מענקים בא.9): מסגרת כחולה, רקע תכלת, תווית מעל כל שדה, פס מנוקד לעמודת הסכום הכולל וכפתור מחק בפינה.',
                'מלאו רק שורות שיש להן מסמכי קצבה תומכים.',
                'תיק ניכויים משלם: 9 ספרות המתחילות ב־9 — כמו בשאר חלקי הטופס.',
                'סוג התשלום בטופס המודפס הוא 30 — בממשק זה הערך קבוע (30) ואינו נדרש להזנה.',
                'סכומים: הזנה עם פסיקים ועד שתי ספרות אחרי הנקודה; ב־XML נשמרים כמספרים שלמים לפי הסכימה.',
                'שימו לב לתאריך המרה לקצבה ולסכומי הבסיס — לאימות מול קופות הגמל.'
            ],
            tip: 'אם אין קצבה כזו — השאירו את הטבלה ריקה.'
        },
        {
            id: 'a12',
            title: 'א.12 — התקרה לרצף קצבה ברירת מחדל',
            bullets: [
                      'בסעיף הראשון נדרש לדווח אם הסכום עולה על סכום "רצף קצבה לברירת מחדל". לצורך החישוב נבדוק מהו הסכום הגבוה מבין תקרה של  405,900 ₪  או 45,600 ₪  כפול שנות הותק בעבודה כולל חלקי שנות עבודה (נכון לשנת 2026). במידה וסכום המענקים מסוג קצבה עולה על הסכום שחושב נסמן כן.' ,
                      'בסעיף השני נדרש לדווח האם חלק מהכספים המשולמים הם כספים שאינם כספי קצבה. במידה ויש תשלומים מפיצויים בקוד 4 (פיצויים הוניים) או מהמעסיק או מקופה מרכזית לפיצויים נסמן כן בסעיף 2.'
                                ],
            tip: 'אם אינכם בטוחים במשמעות — עצרו והשוו לטופס PDF הרשמי או ליועץ לפני סימון.'
        },
        {
            id: 'a13',
            title: 'א.13 — סכומים מרביים (נתוני עזר)',
            lead: 'טבלת עזר לעובד/למעסיק — לרוב מולאת לפי חישובים פנימיים או גיליונות עזר. אינה תמיד חובה טכנית ב־XML אך חשובה לתיעוד.',
            bullets: [
                'השתמשו במקורות חישוב מאושרים בארגון.',
                'ודאו עקביות עם סכומים בחלקים א.9–א.11.'
            ],
            tip: 'שמרו העתק של החישובים לצד הטופס — לצורכי ביקורת עתידית.'
        },
        {
            id: 'submit',
            title: 'יצירת קובץ XML',
            lead: 'לאחר שכל החלקים מולאו ועברו ולידציה, ניתן לייצא קובץ XML להעלאה למערכת המתאימה.',
            bullets: [
                'בדקו שהקובץ נפתח ונראה תקין לפני משלוח סופי.',
                'שמרו גיבוי של ה־XML עם תאריך ושם העובד.'
            ],
            tip: 'אם מתקבלות שגיאות סכימה (XSD) מהמערכת הנקלטת — השוו לשדות שב־mivne161.txt / לסכימה הרשמית.'
        }
    ];

    /** טקסטים קצרים ליד שדות — מוצגים בלחיצה על סימון העזרה */
    const FIELD_HELP = {
        employeeIdNumber: 'תעודת זהות ישראלית בתשע ספרות.',
        firstName: 'שדה חובה.',
        lastName: 'שדה חובה.',
        employeeZipCode: 'מיקוד בן 5–7 ספרות בלבד, ללא אותיות.',
        holderOfControllingInterest: 'סמנו אם העובד עומד בהגדרת בעל שליטה במעסיק.',
        relativeHolderOfControllingInterest: 'סמנו אם העובד קרוב לבעל שליטה; יש לבחור סוג קירבה מהרשימה.',
        relationshipType: 'נדרש רק כאשר סומן "קרוב לבעל שליטה".',
        employerDeductionFile: 'שדה חובה - תיק ניכויים של תשע ספרות המתחיל ב־9 - כפי שמופיע ברשות המיסים.',
        employerName: 'שם המעסיק הרשום; מומלץ כפי שמופיע בתיק הניכויים.',
        employerZipCode: 'מיקוד בן 5–7 ספרות בלבד.',
        contactEmail: 'דוא"ל של איש קשר טכני להגשה ובירורים.',
        contactPhoneNumber: 'בחרו קידומת, ואז הזינו בדיוק 7 ספרות אחרי הקידומת — שדה חובה.',
        previousFormDate: 'מלאו כאשר מסמנים טופס מתוקן — תאריך הטופס הקודם שנשלח.',
        retirementReason: 'בחרו סיבת פרישה אחת בלבד — לפי המצב בפועל.',
        employmentStartDate: 'יום תחילת העבודה אצל המעסיק המדווח.',
        employmentRetirementDate: 'היום בו הסתיימו יחסי עובד ומעסיק.',
        employmentPeriodYears: 'מחושב אוטומטית מהתאריכים (הפרש ימים, חלוקה ל־365).',
        uniformSalaryCheckbox: 'כאשר מסומן, שתי משכורות הנלוות יעודכנו אוטומטית כמו המשכורת החודשית האחרונה (לעריכה נפרדת — בטלו סימון).',
        fullLastSalaryBeforeRetirement: 'המשכורת החודשית המלאה לפני הפרישה בלבד.',
        lastInsuredSalary: 'המשכורת בגינה בוצעו הפרשות לרכיב הפיצויים',
        severanceSalary: ' משכורת לצורך חישוב "תקרת רצף פיצויים".',
        budgetaryPensionNone: 'סמנו אם אין זכאות לפנסיה תקציבית.',
        budgetaryPensionEntitled: 'סמנו רק אם קיימת זכאות מוכחת; יש למלא פרטים נוספים.',
        entitlementDate: 'תאריך תחילת הזכאות לפנסיה תקציבית.',
        salaryForBudgetaryPensionCalculation: 'המשכורת שעליה מחושבת הפנסיה התקציבית.',
        taxExemptNo: 'העובד לא חויב במס על הפקדות הפיצויים שהיו חייבות במס.',
        taxExemptYes: 'העובד חויב במס על הפקדות מעל התקרה — יש למלא טבלת הפקדות.',
        ceilingOption1No: 'הצהרה לגבי רצף קצבה ברירת מחדל — קראו במדריך.',
        ceilingOption1Yes: 'הצהרה לגבי רצף קצבה ברירת מחדל — קראו במדריך.',
        grantsIncludeNonPensionYes: 'מענקים כוללים גם משלמים שאינם קופות גמל לקצבה.',
        grantsIncludeNonPensionNo: 'מענקים אינם כוללים משלמים כאלה.',
        maxTotalGrantAmount: 'סכום עזר — השוו לחישובים פנימיים.',
        maxPensionContinuityAmount: 'סכום עזר לרצף קצבה.',
        maxSeveranceContinuityAmount: 'סכום עזר לרצף פיצויים.',
        maxExemptGrantAmount: 'סכום עזר לפטור לפי סעיף 9(א).',
        maxTaxableGrantAmount: 'סכום עזר לחלק החייב במס.'
    };

    function injectStyles() {
        if (document.getElementById(GUIDE_STYLE_ID)) return;
        const style = document.createElement('style');
        style.id = GUIDE_STYLE_ID;
        style.textContent = `
            .form161-help-trigger {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                width: 1.15em;
                height: 1.15em;
                margin-inline-start: 0.35em;
                border-radius: 50%;
                border: 1px solid #2a5298;
                color: #2a5298;
                font-size: 0.65em;
                font-weight: 700;
                line-height: 1;
                cursor: help;
                vertical-align: super;
                background: #f0f4fc;
                flex-shrink: 0;
            }
            .form161-help-trigger:hover,
            .form161-help-trigger:focus-visible {
                background: #2a5298;
                color: #fff;
                outline: none;
            }
            .form161-tooltip-pop {
                position: fixed;
                z-index: 10050;
                max-width: min(360px, 92vw);
                padding: 12px 14px;
                background: #1e3c72;
                color: #fff;
                font-size: 0.88rem;
                line-height: 1.45;
                border-radius: 10px;
                box-shadow: 0 8px 28px rgba(0,0,0,0.25);
                visibility: hidden;
                opacity: 0;
                transition: opacity 0.15s ease;
                pointer-events: none;
            }
            .form161-tooltip-pop.is-visible {
                visibility: visible;
                opacity: 1;
            }
            .form161-guide-backdrop {
                position: fixed;
                inset: 0;
                background: rgba(30, 60, 114, 0.35);
                z-index: 10040;
                opacity: 0;
                visibility: hidden;
                transition: opacity 0.2s ease;
            }
            .form161-guide-backdrop.is-open {
                opacity: 1;
                visibility: visible;
            }
            .form161-guide-panel {
                position: fixed;
                top: 0;
                left: 0;
                height: 100%;
                width: min(420px, 94vw);
                max-width: 100%;
                background: #fff;
                z-index: 10045;
                box-shadow: -6px 0 32px rgba(0,0,0,0.12);
                transform: translateX(-100%);
                transition: transform 0.25s ease;
                display: flex;
                flex-direction: column;
                overflow: hidden;
            }
            .form161-guide-panel.is-open {
                transform: translateX(0);
            }
            .form161-guide-header {
                padding: 16px 18px;
                background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
                color: #fff;
            }
            .form161-guide-header h2 {
                font-size: 1.05rem;
                font-weight: 600;
                margin: 0 0 6px 0;
            }
            .form161-guide-header p {
                margin: 0;
                font-size: 0.82rem;
                opacity: 0.92;
                line-height: 1.4;
            }
            .form161-guide-tabs {
                display: flex;
                border-bottom: 1px solid #e0e0e0;
                background: #f8f9fc;
            }
            .form161-guide-tab {
                flex: 1;
                padding: 10px 8px;
                border: none;
                background: transparent;
                font-family: inherit;
                font-size: 0.82rem;
                font-weight: 600;
                color: #555;
                cursor: pointer;
            }
            .form161-guide-tab.is-active {
                color: #1e3c72;
                border-bottom: 3px solid #2a5298;
                background: #fff;
            }
            .form161-guide-body {
                flex: 1;
                overflow-y: auto;
                padding: 14px 16px 24px;
            }
            .form161-guide-toc {
                list-style: none;
                margin: 0;
                padding: 0;
            }
            .form161-guide-toc li {
                margin-bottom: 6px;
            }
            .form161-guide-toc button {
                width: 100%;
                text-align: right;
                padding: 10px 12px;
                border: 1px solid #e4e7ef;
                border-radius: 8px;
                background: #fafbfe;
                font-family: inherit;
                font-size: 0.85rem;
                cursor: pointer;
                color: #1e3c72;
            }
            .form161-guide-toc button:hover {
                border-color: #2a5298;
                background: #eef3fb;
            }
            .form161-guide-section-block {
                margin-bottom: 22px;
                padding-bottom: 18px;
                border-bottom: 1px solid #eee;
            }
            .form161-guide-section-block h3 {
                font-size: 0.95rem;
                color: #1e3c72;
                margin: 0 0 8px 0;
            }
            .form161-guide-section-block .lead {
                font-size: 0.86rem;
                color: #444;
                line-height: 1.5;
                margin: 0 0 10px 0;
            }
            .form161-guide-section-block ul {
                margin: 0;
                padding-inline-start: 1.1em;
                font-size: 0.84rem;
                color: #333;
                line-height: 1.5;
            }
            .form161-guide-section-block .tip {
                margin-top: 10px;
                padding: 10px 12px;
                background: #fff8e6;
                border-radius: 8px;
                border-inline-start: 4px solid #f39c12;
                font-size: 0.8rem;
                color: #5d4a00;
                line-height: 1.45;
            }
            .form161-guide-pdf-wrap {
                height: min(72vh, 560px);
                border: 1px solid #ddd;
                border-radius: 8px;
                overflow: hidden;
                background: #f5f5f5;
            }
            .form161-guide-pdf-wrap iframe {
                width: 100%;
                height: 100%;
                border: none;
            }
            .form161-guide-pdf-fallback {
                padding: 16px;
                font-size: 0.85rem;
                color: #555;
            }
            .form161-guide-pdf-fallback a {
                color: #2a5298;
                font-weight: 600;
            }
            .btn-guide-header {
                padding: 8px 14px;
                border-radius: 8px;
                border: 2px solid rgba(255,255,255,0.85);
                background: rgba(255,255,255,0.12);
                color: #fff;
                font-family: inherit;
                font-size: 0.88rem;
                font-weight: 600;
                cursor: pointer;
                transition: background 0.2s ease;
            }
            .btn-guide-header:hover {
                background: rgba(255,255,255,0.22);
            }
            #form161 .form-section .section-title {
                display: flex;
                flex-wrap: wrap;
                align-items: center;
                gap: 8px 12px;
            }
            .form161-section-guide-link {
                margin-inline-start: auto;
                font-size: 0.55em;
                font-weight: 600;
                padding: 5px 12px;
                border-radius: 6px;
                border: 1px solid #2a5298;
                background: #fff;
                color: #1e3c72;
                cursor: pointer;
                font-family: inherit;
                white-space: nowrap;
            }
            .form161-section-guide-link:hover {
                background: #eef3fb;
            }
        `;
        document.head.appendChild(style);
    }

    function positionTooltip(pop, anchorEl) {
        const r = anchorEl.getBoundingClientRect();
        const margin = 8;
        let top = r.bottom + margin;
        let left = r.left + r.width / 2 - pop.offsetWidth / 2;
        left = Math.max(margin, Math.min(left, window.innerWidth - pop.offsetWidth - margin));
        if (top + pop.offsetHeight > window.innerHeight - margin) {
            top = r.top - pop.offsetHeight - margin;
        }
        pop.style.top = `${Math.max(margin, top)}px`;
        pop.style.left = `${left}px`;
    }

    function setupFieldTooltips() {
        const pop = document.createElement('div');
        pop.className = 'form161-tooltip-pop';
        pop.setAttribute('role', 'tooltip');
        document.body.appendChild(pop);

        let hideTimer = null;

        function hidePop() {
            pop.classList.remove('is-visible');
        }

        function showFor(trigger, text) {
            if (hideTimer) clearTimeout(hideTimer);
            pop.textContent = text;
            pop.classList.add('is-visible');
            requestAnimationFrame(() => positionTooltip(pop, trigger));
        }

        Object.keys(FIELD_HELP).forEach(function (fieldId) {
            const input = document.getElementById(fieldId);
            if (!input) return;

            let label = document.querySelector('label[for="' + fieldId + '"]');
            if (!label && input.closest('.form-group')) {
                label = input.closest('.form-group').querySelector('label');
            }
            if (!label) return;

            if (label.querySelector('.form161-help-trigger')) return;

            const trigger = document.createElement('button');
            trigger.type = 'button';
            trigger.className = 'form161-help-trigger';
            trigger.textContent = 'i';
            trigger.setAttribute('aria-label', 'הסבר על השדה');
            //trigger.setAttribute('title', 'הסבר');

            trigger.addEventListener('mouseenter', function () {
                showFor(trigger, FIELD_HELP[fieldId]);
            });
            trigger.addEventListener('mouseleave', function () {
                hideTimer = setTimeout(hidePop, 120);
            });
            trigger.addEventListener('focus', function () {
                showFor(trigger, FIELD_HELP[fieldId]);
            });
            trigger.addEventListener('blur', function () {
                hideTimer = setTimeout(hidePop, 120);
            });
            trigger.addEventListener('click', function (e) {
                e.preventDefault();
                if (pop.classList.contains('is-visible') && pop.textContent === FIELD_HELP[fieldId]) {
                    hidePop();
                } else {
                    showFor(trigger, FIELD_HELP[fieldId]);
                }
            });

            label.appendChild(trigger);
        });

        window.addEventListener('scroll', function () {
            const vis = document.querySelector('.form161-help-trigger:focus');
            if (vis && pop.classList.contains('is-visible')) {
                positionTooltip(pop, vis);
            }
        }, true);
        window.addEventListener('resize', hidePop);
    }

    function scrollToSection(sectionEl) {
        if (!sectionEl) return;
        sectionEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function openSectionByIndex(index) {
        const sections = document.querySelectorAll('#form161 .form-section');
        const section = sections[index];
        if (!section) return;
        if (typeof expandSection === 'function') {
            expandSection(section);
        }
        scrollToSection(section);
    }

    function buildGuidePanel() {
        const backdrop = document.createElement('div');
        backdrop.className = 'form161-guide-backdrop';
        backdrop.setAttribute('aria-hidden', 'true');

        const panel = document.createElement('aside');
        panel.className = 'form161-guide-panel';
        panel.setAttribute('aria-label', 'מדריך למילוי טופס 161');

        const header = document.createElement('div');
        header.className = 'form161-guide-header';
        header.innerHTML =
            '<h2>מדריך למילוי — חלק א׳</h2>' +
            '<p>הנחיות מקצועיות לממלא לפי מבנה הטופס וה־XML. אינן מהוות תחליף לייעוץ מס או משפטי.</p>';

        const tabs = document.createElement('div');
        tabs.className = 'form161-guide-tabs';
        const tabGuide = document.createElement('button');
        tabGuide.type = 'button';
        tabGuide.className = 'form161-guide-tab is-active';
        tabGuide.textContent = 'הסברים לפי חלקים';
        const tabPdf = document.createElement('button');
        tabPdf.type = 'button';
        tabPdf.className = 'form161-guide-tab';
        tabPdf.textContent = 'טופס PDF';
        tabs.appendChild(tabGuide);
        tabs.appendChild(tabPdf);

        const body = document.createElement('div');
        body.className = 'form161-guide-body';

        const paneGuide = document.createElement('div');
        paneGuide.className = 'form161-guide-pane-guide';

        const toc = document.createElement('ul');
        toc.className = 'form161-guide-toc';
        SECTION_GUIDES.forEach(function (sec, idx) {
            const li = document.createElement('li');
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.textContent = sec.title;
            btn.addEventListener('click', function () {
                openSectionByIndex(idx);
                const target = document.getElementById('guide-block-' + sec.id);
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });
            li.appendChild(btn);
            toc.appendChild(li);
        });
        paneGuide.appendChild(toc);

        SECTION_GUIDES.forEach(function (sec) {
            const block = document.createElement('div');
            block.className = 'form161-guide-section-block';
            block.id = 'guide-block-' + sec.id;
            const h3 = document.createElement('h3');
            h3.textContent = sec.title;
            const lead = document.createElement('p');
            lead.className = 'lead';
            lead.textContent = sec.lead;
            const ul = document.createElement('ul');
            sec.bullets.forEach(function (b) {
                const li = document.createElement('li');
                li.textContent = b;
                ul.appendChild(li);
            });
            block.appendChild(h3);
            block.appendChild(lead);
            block.appendChild(ul);
            if (sec.tip) {
                const tip = document.createElement('div');
                tip.className = 'tip';
                tip.innerHTML = '<strong>טיפ מקצועי:</strong> ' + sec.tip;
                block.appendChild(tip);
            }
            paneGuide.appendChild(block);
        });

        const panePdf = document.createElement('div');
        panePdf.className = 'form161-guide-pane-pdf';
        panePdf.style.display = 'none';
        const pdfWrap = document.createElement('div');
        pdfWrap.className = 'form161-guide-pdf-wrap';
        const iframe = document.createElement('iframe');
        iframe.title = 'טופס 161 PDF';
        iframe.src = 'tofes-161.pdf';
        const fallback = document.createElement('div');
        fallback.className = 'form161-guide-pdf-fallback';
        fallback.innerHTML =
            'אם ה־PDF לא מוצג בחלון (מגבלות דפדפן), ' +
            '<a href="tofes-161.pdf" target="_blank" rel="noopener">פתחו את הקובץ בלשונית חדשה</a>.';
        pdfWrap.appendChild(iframe);
        panePdf.appendChild(pdfWrap);
        panePdf.appendChild(fallback);

        body.appendChild(paneGuide);
        body.appendChild(panePdf);

        function setTab(which) {
            if (which === 'guide') {
                tabGuide.classList.add('is-active');
                tabPdf.classList.remove('is-active');
                paneGuide.style.display = '';
                panePdf.style.display = 'none';
            } else {
                tabPdf.classList.add('is-active');
                tabGuide.classList.remove('is-active');
                paneGuide.style.display = 'none';
                panePdf.style.display = '';
            }
        }
        tabGuide.addEventListener('click', function () { setTab('guide'); });
        tabPdf.addEventListener('click', function () { setTab('pdf'); });

        const closeBtn = document.createElement('button');
        closeBtn.type = 'button';
        closeBtn.textContent = 'סגירה';
        closeBtn.className = 'btn-guide-header';
        closeBtn.style.marginTop = '12px';
        closeBtn.style.width = '100%';
        closeBtn.addEventListener('click', closeGuide);
        header.appendChild(closeBtn);

        panel.appendChild(header);
        panel.appendChild(tabs);
        panel.appendChild(body);

        document.body.appendChild(backdrop);
        document.body.appendChild(panel);

        backdrop.addEventListener('click', closeGuide);

        function openGuide() {
            backdrop.classList.add('is-open');
            panel.classList.add('is-open');
            backdrop.setAttribute('aria-hidden', 'false');
        }

        function closeGuide() {
            backdrop.classList.remove('is-open');
            panel.classList.remove('is-open');
            backdrop.setAttribute('aria-hidden', 'true');
        }

        window.openForm161Guide = function (sectionIndex) {
            openGuide();
            setTab('guide');
            if (typeof sectionIndex === 'number' && sectionIndex >= 0) {
                openSectionByIndex(sectionIndex);
                const sec = SECTION_GUIDES[sectionIndex];
                if (sec) {
                    const target = document.getElementById('guide-block-' + sec.id);
                    if (target) {
                        setTimeout(function () {
                            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }, 280);
                    }
                }
            }
        };

        window.closeForm161Guide = closeGuide;

        const headerBtn = document.getElementById('openFormGuideBtn');
        if (headerBtn) {
            headerBtn.addEventListener('click', function () {
                window.openForm161Guide(0);
            });
        }

        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && panel.classList.contains('is-open')) {
                closeGuide();
            }
        });
    }

    function enhanceSectionTitlesWithGuideLink() {
        const sections = document.querySelectorAll('#form161 .form-section');
        sections.forEach(function (section, index) {
            const title = section.querySelector('.section-title');
            if (!title || title.querySelector('.form161-section-guide-link')) return;

            const link = document.createElement('button');
            link.type = 'button';
            link.className = 'form161-section-guide-link';
            link.textContent = 'מדריך לחלק זה';
            link.addEventListener('click', function (e) {
                e.stopPropagation();
                if (typeof window.openForm161Guide === 'function') {
                    window.openForm161Guide(index);
                }
            });
            title.appendChild(link);
        });
    }

    window.initForm161Guide = function () {
        injectStyles();
        buildGuidePanel();
        setupFieldTooltips();
        enhanceSectionTitlesWithGuideLink();
    };
})();
