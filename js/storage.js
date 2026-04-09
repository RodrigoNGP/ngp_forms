// ============================================
// NGP Forms — Data Layer (localStorage)
// ============================================

const Storage = {
  FORMS_KEY: 'ngp_forms',
  RESPONSES_KEY: 'ngp_responses',

  // --- Forms ---
  getForms() {
    return JSON.parse(localStorage.getItem(this.FORMS_KEY) || '[]');
  },

  getForm(id) {
    return this.getForms().find(f => f.id === id) || null;
  },

  saveForm(form) {
    const forms = this.getForms();
    const idx = forms.findIndex(f => f.id === form.id);
    form.updatedAt = new Date().toISOString();
    if (idx >= 0) {
      forms[idx] = form;
    } else {
      form.createdAt = form.createdAt || new Date().toISOString();
      forms.push(form);
    }
    localStorage.setItem(this.FORMS_KEY, JSON.stringify(forms));
    return form;
  },

  deleteForm(id) {
    const forms = this.getForms().filter(f => f.id !== id);
    localStorage.setItem(this.FORMS_KEY, JSON.stringify(forms));
    // Also delete responses
    const responses = this.getAllResponses();
    delete responses[id];
    localStorage.setItem(this.RESPONSES_KEY, JSON.stringify(responses));
  },

  duplicateForm(id) {
    const form = this.getForm(id);
    if (!form) return null;
    const newForm = JSON.parse(JSON.stringify(form));
    newForm.id = this.generateId();
    newForm.title = form.title + ' (cópia)';
    newForm.createdAt = new Date().toISOString();
    newForm.updatedAt = new Date().toISOString();
    newForm.published = false;
    return this.saveForm(newForm);
  },

  // --- Responses ---
  getAllResponses() {
    return JSON.parse(localStorage.getItem(this.RESPONSES_KEY) || '{}');
  },

  getResponses(formId) {
    return this.getAllResponses()[formId] || [];
  },

  saveResponse(formId, response) {
    const all = this.getAllResponses();
    if (!all[formId]) all[formId] = [];
    response.id = this.generateId();
    response.submittedAt = new Date().toISOString();
    all[formId].push(response);
    localStorage.setItem(this.RESPONSES_KEY, JSON.stringify(all));
    return response;
  },

  getResponseCount(formId) {
    return this.getResponses(formId).length;
  },

  // --- Helpers ---
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  },

  createBlankForm() {
    return {
      id: this.generateId(),
      title: 'Formulário sem título',
      description: '',
      fields: [],
      theme: {
        primaryColor: '#6C5CE7',
        backgroundColor: '#1a1a2e',
        textColor: '#ffffff',
        buttonColor: '#6C5CE7',
        fontFamily: 'Inter',
        backgroundImage: '',
        logoUrl: ''
      },
      settings: {
        showProgressBar: true,
        showQuestionNumbers: true,
        submitButtonText: 'Enviar',
        thankYouTitle: 'Obrigado! 🎉',
        thankYouMessage: 'Suas respostas foram enviadas com sucesso.',
        thankYouRedirectUrl: ''
      },
      published: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  },

  createField(type) {
    const base = {
      id: this.generateId(),
      type,
      title: '',
      description: '',
      required: false,
      placeholder: ''
    };

    const defaults = {
      short_text:    { title: 'Texto curto', placeholder: 'Digite sua resposta...' },
      long_text:     { title: 'Texto longo', placeholder: 'Digite sua resposta...' },
      email:         { title: 'Qual seu e-mail?', placeholder: 'nome@exemplo.com' },
      phone:         { title: 'Qual seu telefone?', placeholder: '(00) 00000-0000' },
      number:        { title: 'Número', placeholder: '0' },
      url:           { title: 'URL', placeholder: 'https://' },
      multiple_choice: { title: 'Múltipla escolha', options: ['Opção 1', 'Opção 2', 'Opção 3'], allowMultiple: false, allowOther: false },
      checkbox:      { title: 'Caixas de seleção', options: ['Opção 1', 'Opção 2', 'Opção 3'], allowOther: false },
      dropdown:      { title: 'Lista suspensa', options: ['Opção 1', 'Opção 2', 'Opção 3'] },
      yes_no:        { title: 'Sim ou Não?' },
      rating:        { title: 'Avaliação', maxRating: 5, ratingIcon: 'star' },
      opinion_scale: { title: 'Escala de opinião', minValue: 0, maxValue: 10, minLabel: 'Nada provável', maxLabel: 'Muito provável' },
      date:          { title: 'Data', placeholder: 'DD/MM/AAAA' },
      welcome:       { title: 'Bem-vindo!', description: 'Clique em começar para iniciar.', buttonText: 'Começar' },
      thank_you:     { title: 'Obrigado!', description: 'Suas respostas foram enviadas.' },
      statement:     { title: 'Declaração', description: 'Este é um texto informativo.', buttonText: 'Continuar' },
      file_upload:   { title: 'Upload de arquivo', maxSize: 10, allowedTypes: 'image/*,.pdf,.doc,.docx' },
      picture_choice:{ title: 'Escolha com imagem', options: [{ label: 'Opção 1', imageUrl: '' }, { label: 'Opção 2', imageUrl: '' }], allowMultiple: false },
    };

    return { ...base, ...(defaults[type] || {}) };
  }
};
