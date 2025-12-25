/**
 * Calendar utilities for generating iCalendar (.ics) files
 */

interface CalendarEvent {
  title: string;
  description?: string;
  location?: string;
  startDate: Date;
  endDate: Date;
  organizerEmail?: string;
  attendeeEmail?: string;
}

/**
 * Format a date to iCalendar format (YYYYMMDDTHHMMSSZ)
 */
function formatICSDate(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  const seconds = String(date.getUTCSeconds()).padStart(2, '0');
  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
}

/**
 * Generate a unique ID for the event
 */
function generateUID(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}@bookme.app`;
}

/**
 * Escape special characters in iCalendar text fields
 */
function escapeICSText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '');
}

/**
 * Generate an iCalendar (.ics) file content
 */
export function generateICS(event: CalendarEvent): string {
  const now = new Date();
  const uid = generateUID();
  const dtstamp = formatICSDate(now);
  const dtstart = formatICSDate(event.startDate);
  const dtend = formatICSDate(event.endDate);

  let icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//BookMe//Barberia App//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART:${dtstart}`,
    `DTEND:${dtend}`,
    `SUMMARY:${escapeICSText(event.title)}`,
  ];

  if (event.description) {
    icsContent.push(`DESCRIPTION:${escapeICSText(event.description)}`);
  }

  if (event.location) {
    icsContent.push(`LOCATION:${escapeICSText(event.location)}`);
  }

  if (event.organizerEmail) {
    icsContent.push(`ORGANIZER:mailto:${event.organizerEmail}`);
  }

  if (event.attendeeEmail) {
    icsContent.push(`ATTENDEE:mailto:${event.attendeeEmail}`);
  }

  // Add alarm (reminder 30 minutes before)
  icsContent.push(
    'BEGIN:VALARM',
    'TRIGGER:-PT30M',
    'DESCRIPTION:Recordatorio de cita en BookMe',
    'ACTION:DISPLAY',
    'END:VALARM'
  );

  icsContent.push('END:VEVENT', 'END:VCALENDAR');

  return icsContent.join('\r\n');
}

/**
 * Create a data URL for downloading the .ics file
 */
export function createICSDataURL(icsContent: string): string {
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  return URL.createObjectURL(blob);
}

/**
 * Generate ICS for an appointment
 */
export interface AppointmentData {
  id: string;
  date: string; // ISO date string
  time: string; // HH:MM format
  service: {
    name: string;
    duration: number; // in minutes
  };
  barber: {
    name: string;
    email?: string;
  };
  client: {
    name: string;
    email?: string;
  };
  location?: string;
}

export function generateAppointmentICS(appointment: AppointmentData): string {
  // Parse date and time
  const [hours, minutes] = appointment.time.split(':').map(Number);
  const startDate = new Date(appointment.date);
  startDate.setHours(hours, minutes, 0, 0);

  // Calculate end date (start + service duration)
  const endDate = new Date(startDate);
  endDate.setMinutes(endDate.getMinutes() + appointment.service.duration);

  const title = `${appointment.service.name} - BookMe`;
  const description = `Cita con ${appointment.barber.name} para ${appointment.service.name}.\n\nCliente: ${appointment.client.name}\n\nReserva ID: ${appointment.id}\n\nPowered by BookMe - Tu Barbería`;
  const location = appointment.location || 'BookMe Barbería';

  return generateICS({
    title,
    description,
    location,
    startDate,
    endDate,
    organizerEmail: appointment.barber.email,
    attendeeEmail: appointment.client.email,
  });
}

/**
 * Download an .ics file in the browser
 */
export function downloadICS(icsContent: string, filename: string = 'appointment.ics') {
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generate a Google Calendar URL for an appointment
 */
export function generateGoogleCalendarUrl(appointment: AppointmentData): string {
  // Parse date and time
  const [hours, minutes] = appointment.time.split(':').map(Number);
  const startDate = new Date(appointment.date);
  startDate.setHours(hours, minutes, 0, 0);

  // Calculate end date
  const endDate = new Date(startDate);
  endDate.setMinutes(endDate.getMinutes() + appointment.service.duration);

  // Format dates for Google Calendar (yyyyMMddTHHmmssZ)
  const formatGoogleDate = (date: Date): string => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  // Build event details
  const title = `Cita en BookMe - ${appointment.service.name}`;
  const description = [
    `Servicio: ${appointment.service.name}`,
    `Barbero: ${appointment.barber.name}`,
    `Duración: ${appointment.service.duration} minutos`,
    `Cliente: ${appointment.client.name}`,
    '',
    'Reservado a través de BookMe - Tu Barbería',
  ].join('\\n');

  const eventLocation = appointment.location || 'BookMe - Tu Barbería';

  // Build URL parameters
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${formatGoogleDate(startDate)}/${formatGoogleDate(endDate)}`,
    details: description,
    location: eventLocation,
  });

  // Add attendees if available
  const attendees = [appointment.barber.email, appointment.client.email].filter(Boolean).join(',');
  if (attendees) {
    params.append('add', attendees);
  }

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Open Google Calendar in a new tab with the appointment pre-filled
 */
export function openInGoogleCalendar(appointment: AppointmentData) {
  const url = generateGoogleCalendarUrl(appointment);
  window.open(url, '_blank', 'noopener,noreferrer');
}
