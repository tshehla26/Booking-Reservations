
const express = require("express");
const cors = require("cors");
const { randomUUID } = require("crypto");

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// Resources available for booking
const resources = ["Meeting Room A", "Meeting Room B"];

// Store bookings in memory
let bookings = [];

// Available booking times
const timeSlots = [
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
];

// Validate the date format and actual calendar date
function isValidDate(date) {
  if (typeof date !== "string") return false;

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);

  if (!match) return false;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const parsed = new Date(`${date}T00:00:00Z`);

  return (
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() + 1 === month &&
    parsed.getUTCDate() === day
  );
}


function isPastDate(date) {
  const today = new Date().toISOString().slice(0, 10);
  return date < today;
}


function isValidResource(resource) {
  return resources.includes(resource);
}


app.get("/", (req, res) => {
  res.send("Booking API is running!");
});


app.get("/api/slots", (req, res) => {
  const { date, resource } = req.query;

  if (!isValidDate(date)) {
    return res.status(400).json({
      message: "Please provide a valid date in YYYY-MM-DD format.",
    });
  }

  if (isPastDate(date)) {
    return res.status(400).json({
      message: "You cannot book a date in the past.",
    });
  }

  if (!isValidResource(resource)) {
    return res.status(400).json({
      message: "Please select a valid resource.",
    });
  }

  const bookedTimes = bookings
    .filter(
      (booking) =>
        booking.date === date &&
        booking.resource === resource
    )
    .map((booking) => booking.time);

  const availableSlots = timeSlots.filter(
    (time) => !bookedTimes.includes(time)
  );

  res.json({
    date,
    resource,
    availableSlots,
  });
});


app.post("/api/bookings", (req, res) => {
  const { name, email, date, time, resource } = req.body;

  if (
    typeof name !== "string" ||
    !name.trim() ||
    typeof email !== "string" ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
  ) {
    return res.status(400).json({
      message: "Please enter a valid name and email address.",
    });
  }

  if (!isValidDate(date) || isPastDate(date)) {
    return res.status(400).json({
      message: "Please select a valid date that is not in the past.",
    });
  }

  if (!isValidResource(resource) || !timeSlots.includes(time)) {
    return res.status(400).json({
      message: "Please select a valid resource and time slot.",
    });
  }

  
  const conflict = bookings.some(
    (booking) =>
      booking.date === date &&
      booking.resource === resource &&
      booking.time === time
  );

  if (conflict) {
    return res.status(409).json({
      message: "This time slot is already booked.",
    });
  }

  const booking = {
    id: randomUUID(),
    name: name.trim(),
    email: email.trim(),
    date,
    time,
    resource,
  };

  bookings.push(booking);

  res.status(201).json({
    message: "Booking created successfully.",
    booking,
  });
});


app.get("/api/bookings/:date/:resource", (req, res) => {
  const { date, resource } = req.params;

  if (!isValidDate(date) || !isValidResource(resource)) {
    return res.status(400).json({
      message: "Please provide a valid date and resource.",
    });
  }

  const matchingBookings = bookings.filter(
    (booking) =>
      booking.date === date &&
      booking.resource === resource
  );

  res.json(matchingBookings);
});


app.delete("/api/bookings/:id", (req, res) => {
  const { id } = req.params;

  const bookingIndex = bookings.findIndex(
    (booking) => booking.id === id
  );

  if (bookingIndex === -1) {
    return res.status(404).json({
      message: "Booking not found.",
    });
  }

  bookings.splice(bookingIndex, 1);

  res.json({
    message: "Booking cancelled successfully.",
  });
});


app.listen(PORT, () => {
  console.log(`Booking API is running at http://localhost:${PORT}`);
});
