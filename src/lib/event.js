export function generateICS({ title, start, end, description, location }) {

  const formatDate = date => date.toISOString().replace(/-|:|\.\d{3}/g, "")
  const escapeICS = text => text.replace(/[,\\;]/g, (match) => `\\${match}`)

  const icsContent = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Elela//EN",
    "BEGIN:VEVENT",
    `UID:${Date.now()}@elela.online`, // Unique ID
    `DTSTAMP:${formatDate(new Date())}`,
    `DTSTART:${formatDate(start)}`,
    `DTEND:${formatDate(end)}`,
    `SUMMARY:${escapeICS(title)}`,
    `DESCRIPTION:${escapeICS(description)}`,
    `LOCATION:${escapeICS(location)}`,
    "END:VEVENT",
    "END:VCALENDAR"
  ].join("\r\n"); // Use `\r\n` for ICS compliance

  return new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
}

export function addToCalendar({ title, start, end, description, location }) {
  const icsBlob = generateICS({ title, start, end, description, location })
  const icsUrl = URL.createObjectURL(icsBlob)

  const downloadLink = document.createElement("a");
  downloadLink.href = icsUrl;
  downloadLink.download = `${title.replace(/\s+/g, "_")}.ics`
  document.body.appendChild(downloadLink)
  downloadLink.click()
  document.body.removeChild(downloadLink)
}