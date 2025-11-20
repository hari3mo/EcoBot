const templates = {
    question: {
        title: 'Ask a Question for Class',
        fields: [
            { name: 'education_level', label: 'Education Level', type: 'select', options: ['High School', 'Undergraduate', 'Graduate', 'PhD'] },
            { name: 'course_name', label: 'Course Name', type: 'text', placeholder: 'e.g., Biology 101' },
            { name: 'subject', label: 'Subject/Topic', type: 'text', placeholder: 'e.g., Cellular Biology' },
            { name: 'concept', label: 'Concept/Question', type: 'textarea', placeholder: 'What concept do you need explained?' },
            { name: 'format', label: 'Response Format', type: 'select', options: ['Multiple choice', 'Fill in the blank', 'Long answer', 'Short answer', 'Bullet points', 'Table'] }
        ],
        template: (data) => `I am a ${data.education_level} student taking ${data.course_name}, studying ${data.subject}. As a professional tutor for this content, explain ${data.concept} using examples and analogies in ${data.format} format.`
    },
    exam: {
        title: 'Create Exam/Quiz',
        fields: [
            { name: 'education_level', label: 'Education Level', type: 'select', options: ['High School', 'Undergraduate', 'Graduate', 'PhD'] },
            { name: 'course_name', label: 'Course Name', type: 'text', placeholder: 'e.g., Chemistry 201' },
            { name: 'subject', label: 'Subject/Topic', type: 'text', placeholder: 'e.g., Organic Chemistry' },
            { name: 'question_type', label: 'Question Type', type: 'select', options: ['Multiple choice', 'Short answer', 'Long answer', 'Mixed'] },
            { name: 'num_questions', label: 'Number of Questions', type: 'number', placeholder: '10' },
            { name: 'study_material', label: 'Study Material', type: 'textarea', placeholder: 'Paste your study material here...' }
        ],
        template: (data) => `You are a ${data.education_level} student taking ${data.course_name}, studying ${data.subject}. Create a ${data.question_type} test with ${data.num_questions} questions based on: ${data.study_material}\n\nInclude solutions.`
    },
    summarize: {
        title: 'Summarize Text',
        fields: [
            { name: 'education_level', label: 'Education Level', type: 'select', options: ['High School', 'Undergraduate', 'Graduate', 'PhD', 'Professional'] },
            { name: 'course_name', label: 'Course Name', type: 'text', placeholder: 'e.g., Literature 301' },
            { name: 'subject', label: 'Subject/Topic', type: 'text', placeholder: 'e.g., American Literature' },
            { name: 'text', label: 'Text to Summarize', type: 'textarea', placeholder: 'Paste your text here...' },
            { name: 'style', label: 'Summary Style', type: 'select', options: ['Bullet points', 'Paragraph', 'Key points', 'Executive summary'] },
            { name: 'word_count', label: 'Maximum Words', type: 'number', placeholder: '200' },
            { name: 'include_quotes', label: 'Include Direct Quotes?', type: 'select', options: ['No', 'Yes'] }
        ],
        template: (data) => `You are a ${data.education_level} student taking ${data.course_name}, studying ${data.subject}. Summarize the main ideas of the following text in ${data.style} style, using no more than ${data.word_count} words:\n\n${data.text}\n\n${data.include_quotes === 'Yes' ? 'For every main point, include a direct quote from the text as evidence.' : ''}`
    },
    flashcards: {
        title: 'Create Flashcards',
        fields: [
            { name: 'education_level', label: 'Education Level', type: 'select', options: ['High School', 'Undergraduate', 'Graduate', 'PhD'] },
            { name: 'course_name', label: 'Course Name', type: 'text', placeholder: 'e.g., History 101' },
            { name: 'subject', label: 'Subject/Topic', type: 'text', placeholder: 'e.g., World War II' },
            { name: 'num_cards', label: 'Number of Flashcards', type: 'number', placeholder: '20' },
            { name: 'text', label: 'Study Material', type: 'textarea', placeholder: 'Paste your study material here...' }
        ],
        template: (data) => `I am a ${data.education_level} student taking ${data.course_name}, studying ${data.subject}. Generate ${data.num_cards} flashcards that are easy to copy & paste into Quizlet based on the following text, ensuring they stay in order. Do not change or simplify the text:\n\n${data.text}`
    },
    email: {
        title: 'Draft an Email',
        fields: [
            { name: 'role', label: 'Your Role', type: 'text', placeholder: 'e.g., Marketing Manager' },
            { name: 'recipient', label: 'Recipient', type: 'text', placeholder: 'e.g., Team, Client, Professor' },
            { name: 'topic', label: 'Email Topic', type: 'text', placeholder: 'e.g., Project Update' },
            { name: 'tone', label: 'Tone', type: 'select', options: ['Professional', 'Formal', 'Friendly', 'Concise', 'Enthusiastic', 'Neutral', 'Persuasive'] },
            { name: 'cta', label: 'Call-to-Action', type: 'text', placeholder: 'e.g., Schedule a meeting, Review document' }
        ],
        template: (data) => `I am a ${data.role}. Draft a professional email to ${data.recipient} about ${data.topic}, with a ${data.tone} tone and include this call-to-action: ${data.cta}.`
    },
    planning: {
        title: 'Strategic Planning',
        fields: [
            { name: 'education_level', label: 'Education Level', type: 'select', options: ['High School', 'Undergraduate', 'Graduate', 'PhD', 'Professional'] },
            { name: 'course_name', label: 'Course Name (if applicable)', type: 'text', placeholder: 'e.g., Project Management' },
            { name: 'subject', label: 'Subject/Area', type: 'text', placeholder: 'e.g., Software Development' },
            { name: 'num_ideas', label: 'Number of Ideas/Steps', type: 'number', placeholder: '5' },
            { name: 'goal', label: 'Goal/Project', type: 'text', placeholder: 'e.g., Launch new product' },
            { name: 'purpose', label: 'Purpose', type: 'text', placeholder: 'e.g., Increase market share' },
            { name: 'constraints', label: 'Constraints', type: 'text', placeholder: 'e.g., Budget, Time, Resources' }
        ],
        template: (data) => `You are a ${data.education_level} student taking ${data.course_name}, studying ${data.subject}. Propose a ${data.num_ideas} step plan to achieve ${data.goal} for ${data.purpose}. Consider: ${data.constraints}, timeline, costs, benefits, and alternatives.`
    },
    ad: {
        title: 'Create Media Advertisement',
        fields: [
            { name: 'role', label: 'Your Role', type: 'text', placeholder: 'e.g., Marketing Director' },
            { name: 'format', label: 'Advertisement Format', type: 'select', options: ['Social media post', 'Print ad', 'Video script', 'Banner ad', 'Email campaign'] },
            { name: 'product', label: 'Product/Service', type: 'text', placeholder: 'e.g., Fitness App' },
            { name: 'audience', label: 'Target Audience', type: 'text', placeholder: 'e.g., Young professionals, age 25-35' },
            { name: 'value_prop', label: 'Value Proposition', type: 'text', placeholder: 'e.g., Get fit in 15 minutes a day' }
        ],
        template: (data) => `I am a ${data.role}. Draft a ${data.format} for ${data.product}, targeting ${data.audience}, with this value proposition: ${data.value_prop}.`
    },
    rewrite: {
        title: 'Rewrite Content',
        fields: [
            { name: 'education_level', label: 'Education Level', type: 'select', options: ['High School', 'Undergraduate', 'Graduate', 'PhD', 'Professional'] },
            { name: 'course_name', label: 'Course Name (if applicable)', type: 'text', placeholder: 'e.g., English Composition' },
            { name: 'subject', label: 'Subject/Topic', type: 'text', placeholder: 'e.g., Academic Writing' },
            { name: 'tone', label: 'Desired Tone', type: 'select', options: ['Professional', 'Formal', 'Friendly', 'Concise', 'Enthusiastic', 'Critical', 'Neutral', 'Persuasive'] },
            { name: 'purpose', label: 'Purpose', type: 'text', placeholder: 'e.g., Academic paper, Blog post' },
            { name: 'text', label: 'Text to Rewrite', type: 'textarea', placeholder: 'Paste your text here...' }
        ],
        template: (data) => `I am a ${data.education_level} student taking ${data.course_name}, studying ${data.subject}. Rewrite the following text in a ${data.tone} tone for ${data.purpose}, preserving the original meaning:\n\n${data.text}`
    },
    improve: {
        title: 'Improve Text',
        fields: [
            { name: 'education_level', label: 'Education Level', type: 'select', options: ['High School', 'Undergraduate', 'Graduate', 'PhD', 'Professional'] },
            { name: 'course_name', label: 'Course Name (if applicable)', type: 'text', placeholder: 'e.g., Technical Writing' },
            { name: 'subject', label: 'Subject/Topic', type: 'text', placeholder: 'e.g., Research Methods' },
            { name: 'text_type', label: 'Text Type', type: 'select', options: ['Essay', 'Email', 'Report', 'Article', 'Proposal', 'Resume'] },
            { name: 'issues', label: 'Issues to Fix', type: 'text', placeholder: 'e.g., Grammar, Clarity, Conciseness' },
            { name: 'tone', label: 'Desired Tone', type: 'select', options: ['Professional', 'Formal', 'Friendly', 'Concise', 'Enthusiastic', 'Neutral'] },
            { name: 'text', label: 'Text to Improve', type: 'textarea', placeholder: 'Paste your text here...' }
        ],
        template: (data) => `I am a ${data.education_level} student taking ${data.course_name}, studying ${data.subject}. Edit this ${data.text_type} text to fix ${data.issues} and improve clarity in a ${data.tone} tone:\n\n${data.text}`
    },
    organize: {
        title: 'Organize Information',
        fields: [
            { name: 'role', label: 'Your Role', type: 'text', placeholder: 'e.g., Data Analyst, Student' },
            { name: 'categories', label: 'Categories', type: 'text', placeholder: 'e.g., By priority, By type, By date' },
            { name: 'format', label: 'Output Format', type: 'select', options: ['Table', 'Bullet points', 'Numbered list', 'Categories with subsections'] },
            { name: 'items', label: 'Items to Organize', type: 'textarea', placeholder: 'List items here, one per line or separated by commas...' }
        ],
        template: (data) => `I am ${data.role}. Sort the following list into ${data.categories} and present them as ${data.format}:\n\n${data.items}`
    },
    resume: {
        title: 'Build a Resume',
        fields: [
            { name: 'level', label: 'Experience Level', type: 'select', options: ['Entry-level', 'Mid-level', 'Senior', 'Executive'] },
            { name: 'job_title', label: 'Target Job Title', type: 'text', placeholder: 'e.g., Software Engineer' },
            { name: 'industry', label: 'Industry', type: 'text', placeholder: 'e.g., Technology, Healthcare' },
            { name: 'skills', label: 'Key Skills/Experiences', type: 'textarea', placeholder: 'List your skills and experiences...' },
            { name: 'accomplishments', label: 'Key Accomplishments', type: 'textarea', placeholder: 'List your achievements...' },
            { name: 'keywords', label: 'Important Keywords', type: 'text', placeholder: 'e.g., Agile, Leadership, Python' }
        ],
        template: (data) => `Build a ${data.level} resume for ${data.job_title} in ${data.industry}, highlighting these skills/experiences:\n${data.skills}\n\nFocusing on these accomplishments:\n${data.accomplishments}\n\nEmphasizing these keywords: ${data.keywords}`
    },
    recommendation: {
        title: 'Request Letter of Recommendation',
        fields: [
            { name: 'person', label: 'Person to Ask', type: 'text', placeholder: 'e.g., Professor Smith, Manager Jones' },
            { name: 'context', label: 'Context/Purpose', type: 'select', options: ['Internship', 'Graduate school', 'Job application', 'Scholarship', 'Research position'] },
            { name: 'highlights', label: 'Desired Highlights', type: 'textarea', placeholder: 'What should they emphasize? e.g., Leadership, Research skills' },
            { name: 'deadline', label: 'Deadline', type: 'text', placeholder: 'e.g., March 15, 2024' }
        ],
        template: (data) => `Draft a short, professional email requesting a letter of recommendation from ${data.person} for ${data.context}. Please emphasize: ${data.highlights}. The deadline is ${data.deadline}. Include a courteous closing.`
    }
};

function openTemplate(templateId) {
    const template = templates[templateId];
    const modal = document.getElementById('templateModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');
    const outputSection = document.getElementById('outputSection');

    modalTitle.textContent = template.title;
    outputSection.style.display = 'none';

    let formHTML = '<form id="templateForm">';
    template.fields.forEach(field => {
        formHTML += '<div class="form-group">';
        formHTML += `<label class="form-label">${field.label}</label>`;

        if (field.type === 'select') {
            formHTML += `<select name="${field.name}" class="form-select" required>`;
            formHTML += '<option value="">Select...</option>';
            field.options.forEach(option => {
                formHTML += `<option value="${option}">${option}</option>`;
            });
            formHTML += '</select>';
        } else if (field.type === 'textarea') {
            formHTML += `<textarea name="${field.name}" class="form-textarea" placeholder="${field.placeholder}" required></textarea>`;
        } else if (field.type === 'number') {
            formHTML += `<input type="number" name="${field.name}" class="form-input" placeholder="${field.placeholder}" required>`;
        } else {
            formHTML += `<input type="text" name="${field.name}" class="form-input" placeholder="${field.placeholder}" required>`;
        }

        formHTML += '</div>';
    });
    formHTML += '</form>';

    modalBody.innerHTML = formHTML;
    modal.classList.add('active');

    // Store current template
    modal.dataset.currentTemplate = templateId;
}

function closeModal() {
    const modal = document.getElementById('templateModal');
    modal.classList.remove('active');
}

function generatePrompt() {
    const modal = document.getElementById('templateModal');
    const templateId = modal.dataset.currentTemplate;
    const template = templates[templateId];
    const form = document.getElementById('templateForm');

    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const formData = new FormData(form);
    const data = {};
    for (let [key, value] of formData.entries()) {
        data[key] = value;
    }

    const generatedPrompt = template.template(data);

    const outputSection = document.getElementById('outputSection');
    const outputText = document.getElementById('outputText');
    outputText.textContent = generatedPrompt;
    outputSection.style.display = 'block';

    outputSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function usePrompt() {
    const outputText = document.getElementById('outputText').textContent;
    if (outputText) {
        localStorage.setItem('generatedPrompt', outputText);
        window.location.href = "/";
    }
}
// Close modal on Escape key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeModal();
    }
});