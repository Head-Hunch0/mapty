"use strict";

// parent class for running and cycling
class Workout {
  date = new Date();
  id = (Date.now() + "").slice(-10);
  clicks = 0;
  constructor(coords, distance, duration) {
    this.coords = coords; // [lat , lng]
    this.distance = distance; // in km
    this.duration = duration; // in minutes
  }
  _setDescription() {
    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${months[this.date.getMonth()]} ${this.date.getDate()}`
  }

}
// extends the workout class and inherits all properties
class Running extends Workout {
  type = "running";
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calcPace();
    this._setDescription();
  }
  calcPace() {
    // min/km
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

// extends the workout class and inherits all properties
class Cycling extends Workout {
  type = "cycling";
  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.elevationGain = elevationGain;
    this.calcSpeed();
    this._setDescription();
  }
  calcSpeed() {
    // km/h
    this.speed = this.distance / (this.duration / 60); // convert from minutes to km
    return this.speed;
  }
}
// test for classes cycling and running
// const run1 = new Running([39, -12], 10, 30, 178)
// const cyc1 = new Cycling([39, -12], 5, 60, 270)

// console.log(run1, cyc1)

const form = document.querySelector(".form");
const containerWorkouts = document.querySelector(".workouts");
const inputType = document.querySelector(".form__input--type");
const inputDistance = document.querySelector(".form__input--distance");
const inputDuration = document.querySelector(".form__input--duration");
const inputCadence = document.querySelector(".form__input--cadence");
const inputElevation = document.querySelector(".form__input--elevation");

//main class // application architecture
class App {
  mapboxglx;
  #map;
  // adding private properties to app class
  #mapEvent;
  #workout = [];
  #mapZoomLevel = 13;
  constructor() {
    // get users location
    this._getPosition();

    //get data from local storage
    this._getLocalStorage();

    // event handlers
    form.addEventListener("submit", this._newWorkout.bind(this));
    inputType.addEventListener("change", this._toggleEleveationField);
    containerWorkouts.addEventListener('click', this._moveToPopup.bind(this));

  }

  _getPosition() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert("Could not get your position");
        }
      );
    }
  }

  _loadMap(position) {
    const { latitude } = position.coords;
    const { longitude } = position.coords;
    const coords = [latitude, longitude];

    this.#map = L.map("map").setView(coords, this.#mapZoomLevel);

    L.tileLayer("https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    // handling clicks on map
    this.#map.on("click", this._showForm.bind(this));

    this.#workout.forEach((work) => {
      this._renderWorkOutMarker(work);
    });
    
  }

  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove("hidden");
    inputDistance.focus();
  }
  _hideForm() {
    inputDistance.value = inputCadence.value = inputDuration.value = inputElevation.value = '';
    form.style.display = 'none';
    form.classList.add('hidden');
    setTimeout(()=> (form.style.display = 'grid'),1000)
  }

  _toggleEleveationField() {
    inputElevation.closest(".form__row").classList.toggle("form__row--hidden");
    inputCadence.closest(".form__row").classList.toggle("form__row--hidden");
  }

  _newWorkout(e) {
    // helper function for data validation from form
    const validInputs = (...inputs) =>
      inputs.every((inp) => Number.isFinite(inp));
    // helper function for positive inputs from form data
    const allPositive = (...inputs) => inputs.every((inp) => inp >= 0);

    e.preventDefault();

    // get data from form
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const { lat, lng } = this.#mapEvent.latlng;
    let workout;

    // if workout is running , create running object
    if (type === "running") {
      const cadence = +inputCadence.value;
      // validate data
      if (
        !validInputs(distance, duration, cadence) ||
        !allPositive(distance, duration, cadence)
      )
        return alert("Inputs have to be positive numbers");

      workout = new Running([lat, lng], distance, duration, cadence);
    }

    // if workout is cycling , create cycling object
    if (type === "cycling") {
      const elevation = +inputElevation.value;
      // validate data
      if (
        !validInputs(distance, duration, elevation) ||
        !allPositive(distance, duration)
      )
        return alert("Inputs have to be positive numbers");

      workout = new Cycling([lat, lng], distance, duration, elevation);
    }

    // add new object to workout array
    this.#workout.push(workout);
    //render workout on map as a marker

    this._renderWorkOutMarker(workout);

    // render workout on list
    this._renderWorkout(workout);

    //hide form +  clearing values afrter form submission
    this._hideForm();
    // saves workouts to local storage
    this._setLocalStorage();
  }
  _renderWorkOutMarker(workout) {
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxwidth: 250,
          minwidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(
        `${workout.type === "running" ? "🏃‍♂️" : "🚴‍♀️"} ${workout.description}`
      )
      .openPopup();
  }

  _renderWorkout(workout) {
    let html = `
        <li class="workout workout--${workout.type}" data-id="${workout.id}">
          <h2 class="workout__title">${workout.description}</h2>
          <div class="workout__details">
            <span class="workout__icon">${
              workout.type === "running" ? "🏃‍♂️" : "🚴‍♀️"
            } </span>
            <span class="workout__value">${workout.distance}</span>
            <span class="workout__unit">km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${workout.duration}</span>
            <span class="workout__unit">min</span>
          </div>
    `;

    if (workout.type === "running")
      html += `
       <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">16</span>
            <span class="workout__unit">km/h</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⛰</span>
            <span class="workout__value">223</span>
            <span class="workout__unit">m</span>
          </div>
      `;

    if (workout.type === "cycling")
      html += `
      <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.speed.toFixed(1)}</span>
            <span class="workout__unit">km/h</span>
        </div>
      <div class="workout__details">
            <span class="workout__icon">⛰</span>
            <span class="workout__value">${workout.elevationGain}</span>
            <span class="workout__unit">m</span>
        </div>
        </li>
      `;
    form.insertAdjacentHTML("afterend", html);
    // delete all workouts
    // form.insertAdjacentElement('afterend',)
  }

  _moveToPopup(e) {
    const workoutEl = e.target.closest('.workout')

    if (!workoutEl) return;
    
    const workout = this.#workout.
      find(work => work.id === workoutEl.dataset.id);

    this.mapboxglx.setView(workout.coords, this.#mapZoomLevel) , {
      animate: true,
      pan:{duration:1,}
    }
    // using the public interfaces

  }
  _setLocalStorage() {
    localStorage.setItem('workouts', JSON.stringify(this.#workout));
  }

  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem('workouts'));

    if (!data) return
    
    this.#workout = data;

    this.#workout.forEach(work=>{
      this._renderWorkout(work)
    })
  }
  _reset() {
    localStorage.removeItem('workout');
    location.reload()
  }
}
// class App{
//   mapboxgl;
//   map;
//   constructor() {
    
//   }
//   getLocation() {
//     console.log(navigator.geolocation.getCurrentPosition())
//   }
//   loadMap() {
//     mapboxgl.accessToken = "pk.eyJ1IjoiYmlnZjAwdCIsImEiOiJjbDZhaHV5M3kxazdiM2Jub3NmY3BveW4zIn0.JS8S_dd9ScKziFL6sT11EQ";
//     const map = new mapboxgl.Map({
//       container: "map", // container ID
//       style: "mapbox://styles/mapbox/streets-v11", // style URL
//       center: [-74.5, 40], // starting position [lng, lat]
//       zoom: 9, // starting zoom
//     });
//   }
// }

const app = new App();
