const eventDate = new Date(2017, 10, 15);
const daysUntilEvent = daysUntil(eventDate);

$('h1 span').textContent = daysUntilEvent;

function daysUntil(date) {
    const now = new Date();
    const difference = Math.max(eventDate - now, 0);
    const days = Math.floor(difference / 1000 / 60 / 60/ 24)
    return days;
}

function $(selector, context = document) {
    return context.querySelector(selector);
}
