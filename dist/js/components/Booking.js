import {templates, select, settings, classNames} from "../settings.js";
import AmountWidget from "./AmountWidget.js";
import DatePicker from "./DatePicker.js";
import HourPicker from "./HourPicker.js";
import {utils} from "../utils.js";

class Booking{
    constructor(element){
        const thisBooking = this;

        thisBooking.selectedTable = [];
        thisBooking.starters = [];

        thisBooking.render(element);
        thisBooking.initWidgets();
        thisBooking.getData();
    }

    getData(){
        const thisBooking = this;

        const startDateParam = settings.db.dateStartParamKey + '=' + utils.dateToStr(thisBooking.datePicker.minDate);
        const endDateParam = settings.db.dateEndParamKey + '=' + utils.dateToStr(thisBooking.datePicker.maxDate);

        const params = {
            booking: [
                startDateParam,
                endDateParam,
            ],
            eventsCurrent: [
                settings.db.notRepeatParam,
                startDateParam,
                endDateParam,
            ],
            eventsRepeat: [
                settings.db.repeatParam,
                endDateParam,
            ],
        };

        //console.log('getData params', params);

        const urls = {
            booking:       settings.db.url + '/' + settings.db.bookings
                                           + '?' + params.booking.join('&'),
            eventsCurrent: settings.db.url + '/' + settings.db.events   
                                           + '?' + params.eventsCurrent.join('&'),
            eventsRepeat:  settings.db.url + '/' + settings.db.events   
                                           + '?' + params.eventsRepeat.join('&'),
        };

        //console.log('getData urls', urls);
        Promise.all([
            fetch(urls.booking),
            fetch(urls.eventsCurrent),
            fetch(urls.eventsRepeat),
        ])
            .then(function(allResponses){
                const bookingsResponse = allResponses[0];
                const eventsCurrentResponse = allResponses[1];
                const eventsRepeatResponse = allResponses[2];
                return Promise.all([
                    bookingsResponse.json(),
                    eventsCurrentResponse.json(),
                    eventsRepeatResponse.json(),
                ]);
            })
            .then(function([bookings, eventsCurrent, eventsRepeat]){
            //console.log('bookings', bookings);
            //console.log('eventsCurrent', eventsCurrent);
            //console.log('eventsRepeat', eventsRepeat);
            thisBooking.parseData(bookings, eventsCurrent, eventsRepeat);
            });
    }

    parseData(bookings, eventsCurrent, eventsRepeat){
        const thisBooking = this;

        thisBooking.booked = {};

        for(let item of bookings){
            thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
        }

        for(let item of eventsCurrent){
            thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
        }

        const minDate = thisBooking.datePicker.minDate;
        const maxDate = thisBooking.datePicker.maxDate;

        for(let item of eventsRepeat){
            if(item.repeat == 'daily'){
                for(let loopDate = minDate; loopDate <= maxDate; loopDate = utils.addDays(loopDate, 1)){
                    thisBooking.makeBooked(utils.dateToStr(loopDate), item.hour, item.duration, item.table);
                }
            }
        }
        console.log('thisBooking.booked', thisBooking.booked);

        thisBooking.updateDOM();
    }

    makeBooked(date, hour, duration, table){
        const thisBooking = this;

        if(typeof thisBooking.booked[date] == 'undefined'){
            thisBooking.booked[date] = {};
        }

        const startHour = utils.hourToNumber(hour);

        for(let hourBlock = startHour; hourBlock < startHour + duration; hourBlock += 0.5){
            //console.log('loop', hourBlock);

            if(typeof thisBooking.booked[date][hourBlock] == 'undefined'){
                thisBooking.booked[date][hourBlock] = [];
            }

            thisBooking.booked[date][hourBlock].push(table);    
        }
    }

    updateDOM(){
        const thisBooking = this;

        thisBooking.date = thisBooking.datePicker.value;
        thisBooking.hour = utils.hourToNumber(thisBooking.hourPicker.value);

        let allAvailable = false;

        if(
            typeof thisBooking.booked[thisBooking.date] == 'undefined'
            ||
            typeof thisBooking.booked[thisBooking.date][thisBooking.hour] == 'undefined'
        ){
            allAvailable = true;
        }

        for(let table of thisBooking.dom.tables){
            let tableId = table.getAttribute(settings.booking.tableIdAttribute);
            if(!isNaN(tableId)){
                tableId = parseInt(tableId);
            }

            if(
                !allAvailable
                &&
                thisBooking.booked[thisBooking.date][thisBooking.hour].includes(tableId)
            ){
                table.classList.add(classNames.booking.tableBooked);
            } else {
                table.classList.remove(classNames.booking.tableBooked);
            }
        }
    }

    initTables(event){
        const thisBooking = this;

        const clickedTable = event.target.closest('.table');
        let clickedTableId = clickedTable.getAttribute(settings.booking.tableIdAttribute);

        if(clickedTable){
            if(clickedTable.classList.contains(classNames.booking.tableBooked)) {
                alert("This table is not available");

            } else if(!thisBooking.selectedTable.includes(clickedTableId)) {

                for(let table of thisBooking.dom.tables){ // is there a selected table already?
                    if(table.classList.contains(classNames.booking.tableSelected)){ // if yes remove it
                        table.classList.remove(classNames.booking.tableSelected);
                        const indexOfTable = thisBooking.selectedTable.indexOf(table);
                        thisBooking.selectedTable.splice(indexOfTable, 1);    
                    }
                }

                thisBooking.selectedTable.push(clickedTableId);
                clickedTable.classList.add(classNames.booking.tableSelected); 

            } else if (thisBooking.selectedTable.includes(clickedTableId)){
                const indexOfTable = thisBooking.selectedTable.indexOf(clickedTableId);
                thisBooking.selectedTable.splice(indexOfTable, 1);
                clickedTable.classList.remove(classNames.booking.tableSelected);
            }

            //console.log(thisBooking.selectedTable);
        }
    }

    resetTables(){
        const thisBooking = this;

        for(let table of thisBooking.dom.tables){
            table.classList.remove(classNames.booking.tableSelected);
            const indexOfTable = thisBooking.selectedTable.indexOf(table);
            thisBooking.selectedTable.splice(indexOfTable, 1);
        }
    }

    addStarters(){
        const thisBooking = this;

        thisBooking.dom.bookingOptions.addEventListener('click', function(event){
            if(event.target.tagName == 'INPUT' && event.target.type == 'checkbox' && event.target.name == 'starter'){

                if(event.target.checked){
                    thisBooking.starters.push(event.target.value);
                } else if(!event.target.checked){
                    thisBooking.starters.splice((thisBooking.starters.indexOf(event.target.value)), 1);
                }
            }
        });

    }

    render(element){
        const thisBooking = this;

        thisBooking.dom = {};

        thisBooking.dom.wrapper = element;

        const generatedHTML = templates.bookingWidget();
        const generatedDOM = utils.createDOMFromHTML(generatedHTML);
        thisBooking.dom.wrapper.appendChild(generatedDOM);

        thisBooking.dom.peopleAmount = thisBooking.dom.wrapper.querySelector(select.booking.peopleAmount);
        thisBooking.dom.hoursAmount = thisBooking.dom.wrapper.querySelector(select.booking.hoursAmount);
        thisBooking.dom.datePicker = thisBooking.dom.wrapper.querySelector(select.widgets.datePicker.wrapper);
        thisBooking.dom.hourPicker = thisBooking.dom.wrapper.querySelector(select.widgets.hourPicker.wrapper);

        thisBooking.dom.tables = thisBooking.dom.wrapper.querySelectorAll(select.booking.tables);

        thisBooking.dom.allTables = thisBooking.dom.wrapper.querySelector(select.booking.allTables);

        thisBooking.dom.phone = thisBooking.dom.wrapper.querySelector(select.booking.phone);
        thisBooking.dom.address = thisBooking.dom.wrapper.querySelector(select.booking.address);
        thisBooking.dom.bookTable = thisBooking.dom.wrapper.querySelector(select.booking.bookTable);
        thisBooking.dom.form = thisBooking.dom.wrapper.querySelector(select.booking.form);
        thisBooking.dom.bookingOptions = thisBooking.dom.wrapper.querySelector(select.booking.bookingOptions);

    }

    sendBooking(){
        const thisBooking = this;

        const url = settings.db.url + '/' + settings.db.bookings;

        const payload = {
            date: thisBooking.datePicker.value,
            hour: thisBooking.hourPicker.value,
            table: thisBooking.selectedTable,
            duration: thisBooking.hoursAmount.value + 'h',
            ppl: thisBooking.peopleAmount.value,
            starters: thisBooking.starters,
            phone: thisBooking.dom.phone.value,
            address: thisBooking.dom.address.value
        }

        thisBooking.makeBooked(payload.date, payload.hour, payload.duration, payload.table);
        //console.log('booked', thisBooking.booked);
        //console.log('payload', payload);

        const options = {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
          };

          fetch(url, options)
            .then(function(response){
              return response.json();
            }).then(function(parsedResponse){
              console.log('parsedResponse', parsedResponse);
            });

    }

    initWidgets(){
        const thisBooking = this;

        thisBooking.peopleAmount = new AmountWidget(thisBooking.dom.peopleAmount);
        thisBooking.hoursAmount = new AmountWidget(thisBooking.dom.hoursAmount);
        thisBooking.datePicker = new DatePicker(thisBooking.dom.datePicker);
        thisBooking.hourPicker = new HourPicker(thisBooking.dom.hourPicker);

        thisBooking.dom.peopleAmount.addEventListener('updated', function(){
        });
    
        thisBooking.dom.hoursAmount.addEventListener('updated', function(){
        });

        thisBooking.dom.wrapper.addEventListener('updated', function(){
            thisBooking.updateDOM();
        });

        thisBooking.dom.allTables.addEventListener('click', function(event){
            thisBooking.initTables(event);
        });

        thisBooking.dom.wrapper.addEventListener('updated', function(){
            thisBooking.resetTables();
        });

        thisBooking.addStarters();

        thisBooking.dom.form.addEventListener('submit', function(event){
            event.preventDefault();
            thisBooking.sendBooking();
        });
        
    }
}

export default Booking;