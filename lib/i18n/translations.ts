/* =========================================================
   BookMe – Translation System
   FILE: lib/i18n/translations.ts
   ========================================================= */

export const translations = {
  es: {
    common: {
      loading: 'Cargando...',
      save: 'Guardar',
      cancel: 'Cancelar',
      delete: 'Eliminar',
      edit: 'Editar',
      back: 'Volver',
      next: 'Siguiente',
      confirm: 'Confirmar',
      search: 'Buscar',
      filter: 'Filtrar',
      all: 'Todos',
      yes: 'Sí',
      no: 'No',
      close: 'Cerrar',
      open: 'Abrir',
      success: 'Éxito',
      error: 'Error',
      warning: 'Advertencia',
      info: 'Información',
      welcomeTo: 'Bienvenido a BookMe',
      hello: 'Hola',
      bookNow: 'Reservar Ahora',
    },

    nav: {
      home: 'Inicio',
      explore: 'Explorar',
      gallery: 'Galería',
      reviews: 'Reseñas',
      location: 'Ubicación',
      book: 'Reservar',
      login: 'Iniciar Sesión',
      logout: 'Cerrar Sesión',
      dashboard: 'Panel',
    },

    assistant: {
      title: 'Asistente IA',
      subtitle: 'Pregúntame cualquier cosa',
      placeholder: 'Escribe tu mensaje...',
      send: 'Enviar',
      thinking: 'Pensando...',
      greeting: '¡Hola! ¿En qué puedo ayudarte?',
    },

    inbox: {
      title: 'Mensajes',
      received: 'Recibidos',
      sent: 'Enviados',
      compose: 'Nuevo Mensaje',
      to: 'Para',
      message: 'Mensaje',
      send: 'Enviar',
      sending: 'Enviando...',
      noMessages: 'No hay mensajes',
    },

    dashboard: {
      title: 'Panel',
      welcome: 'Bienvenido',
      overview: 'Resumen',
      statistics: 'Estadísticas',
    },

    admin: {
      title: 'Administración',
      appointments: 'Citas',
      barbers: 'Barberos',
      services: 'Servicios',
      accounting: 'Contabilidad',
      users: 'Usuarios',
    },

    barber: {
      title: 'Panel del Barbero',
      myAppointments: 'Mis Citas',
      myEarnings: 'Mis Ganancias',
    },

    client: {
      title: 'Mi Cuenta',
      myAppointments: 'Mis Citas',
      myProfile: 'Mi Perfil',
    },
  },

  /* ===================== ENGLISH ===================== */

  en: {
    common: {
      loading: 'Loading...',
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      edit: 'Edit',
      back: 'Back',
      next: 'Next',
      confirm: 'Confirm',
      search: 'Search',
      filter: 'Filter',
      all: 'All',
      yes: 'Yes',
      no: 'No',
      close: 'Close',
      open: 'Open',
      success: 'Success',
      error: 'Error',
      warning: 'Warning',
      info: 'Info',
      welcomeTo: 'Welcome to BookMe',
      hello: 'Hello',
      bookNow: 'Book Now',
    },

    nav: {
      home: 'Home',
      explore: 'Explore',
      gallery: 'Gallery',
      reviews: 'Reviews',
      location: 'Location',
      book: 'Book',
      login: 'Login',
      logout: 'Logout',
      dashboard: 'Dashboard',
    },

    assistant: {
      title: 'AI Assistant',
      subtitle: 'Ask me anything',
      placeholder: 'Type your message...',
      send: 'Send',
      thinking: 'Thinking...',
      greeting: 'Hi! How can I help you?',
    },

    inbox: {
      title: 'Messages',
      received: 'Received',
      sent: 'Sent',
      compose: 'New Message',
      to: 'To',
      message: 'Message',
      send: 'Send',
      sending: 'Sending...',
      noMessages: 'No messages',
    },

    dashboard: {
      title: 'Dashboard',
      welcome: 'Welcome',
      overview: 'Overview',
      statistics: 'Statistics',
    },

    admin: {
      title: 'Admin',
      appointments: 'Appointments',
      barbers: 'Barbers',
      services: 'Services',
      accounting: 'Accounting',
      users: 'Users',
    },

    barber: {
      title: 'Barber Dashboard',
      myAppointments: 'My Appointments',
      myEarnings: 'My Earnings',
    },

    client: {
      title: 'My Account',
      myAppointments: 'My Appointments',
      myProfile: 'My Profile',
    },
  },
} as const;

/* ===================== TYPES ===================== */

export type Language = keyof typeof translations;
export type TranslationKey = keyof typeof translations.en;