"use strict";

const STORAGE_KEY = "legionLaundryBookings";

const bookingForm = document.querySelector("#booking-form");
const bookingList = document.querySelector("#booking-list");
const formStatus = document.querySelector("#form-status");
const pickupDateInput = document.querySelector("#pickup-date");

let bookings = [];
let storageAvailable = true;

function showStatus(message, isError = false) {
  formStatus.textContent = message;
  formStatus.classList.toggle("error", isError);
}

function readBookings() {
  try {
    const savedBookings = window.localStorage.getItem(STORAGE_KEY);
    if (!savedBookings) {
      return [];
    }

    const parsedBookings = JSON.parse(savedBookings);
    if (!Array.isArray(parsedBookings)) {
      throw new Error("Saved booking data is not a list.");
    }

    return parsedBookings;
  } catch (error) {
    storageAvailable = false;
    showStatus("Saved bookings could not be read. Check browser storage settings before saving a booking.", true);
    console.error("Could not read saved laundry bookings:", error);
    return [];
  }
}

function saveBookings() {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
    return true;
  } catch (error) {
    showStatus("Your booking could not be saved in this browser. Check available storage and try again.", true);
    console.error("Could not save laundry bookings:", error);
    return false;
  }
}

function addBookingDetail(card, label, value) {
  const detail = document.createElement("p");
  const labelElement = document.createElement("strong");
  labelElement.textContent = `${label}: `;
  detail.append(labelElement, document.createTextNode(value));
  card.append(detail);
}

function renderBookings() {
  bookingList.replaceChildren();

  if (bookings.length === 0) {
    const emptyMessage = document.createElement("p");
    emptyMessage.className = "booking-empty";
    emptyMessage.textContent = "Your bookings will appear here after you save one.";
    bookingList.append(emptyMessage);
    return;
  }

  bookings.forEach((booking) => {
    const card = document.createElement("article");
    card.className = "booking-card";

    const heading = document.createElement("h3");
    heading.textContent = booking.customerName;
    card.append(heading);

    const bookingId = document.createElement("p");
    bookingId.className = "booking-id";
    bookingId.textContent = `Booking reference: ${booking.id}`;
    card.append(bookingId);

    addBookingDetail(card, "Phone", booking.phone);
    if (booking.email) {
      addBookingDetail(card, "Email", booking.email);
    }
    addBookingDetail(card, "Pickup address", booking.address);
    addBookingDetail(card, "Service", booking.service);
    addBookingDetail(card, "Estimated weight", booking.weight);
    addBookingDetail(card, "Pickup date", booking.date);
    addBookingDetail(card, "Pickup time", booking.time);
    if (booking.notes) {
      addBookingDetail(card, "Care notes", booking.notes);
    }

    const deleteButton = document.createElement("button");
    deleteButton.className = "button button-danger";
    deleteButton.type = "button";
    deleteButton.textContent = "Delete booking";
    deleteButton.addEventListener("click", () => deleteBooking(booking.id));
    card.append(deleteButton);
    bookingList.append(card);
  });
}

function deleteBooking(bookingId) {
  const previousBookings = bookings;
  bookings = bookings.filter((booking) => booking.id !== bookingId);

  if (!saveBookings()) {
    bookings = previousBookings;
    return;
  }

  renderBookings();
  showStatus("Booking deleted from this browser.");
}

function makeBookingId() {
  if (window.crypto && typeof window.crypto.randomUUID === "function") {
    return window.crypto.randomUUID();
  }

  return `LL-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

bookingForm.addEventListener("submit", (event) => {
  event.preventDefault();

  if (!storageAvailable) {
    showStatus("Browser storage is unavailable, so this booking cannot be saved.", true);
    return;
  }

  if (!bookingForm.reportValidity()) {
    return;
  }

  const formData = new FormData(bookingForm);
  const booking = {
    id: makeBookingId(),
    customerName: formData.get("customerName").trim(),
    phone: formData.get("phone").trim(),
    email: formData.get("email").trim(),
    address: formData.get("address").trim(),
    service: formData.get("service"),
    weight: formData.get("weight"),
    date: formData.get("date"),
    time: formData.get("time"),
    notes: formData.get("notes").trim()
  };

  bookings.unshift(booking);
  if (!saveBookings()) {
    bookings.shift();
    return;
  }

  renderBookings();
  bookingForm.reset();
  showStatus("Your booking is saved in this browser. Call the business to confirm your pickup.");
});

bookingForm.addEventListener("reset", () => {
  showStatus("");
});

const today = new Date();
const localToday = new Date(today.getTime() - today.getTimezoneOffset() * 60000)
  .toISOString()
  .slice(0, 10);
pickupDateInput.min = localToday;

bookings = readBookings();
renderBookings();
