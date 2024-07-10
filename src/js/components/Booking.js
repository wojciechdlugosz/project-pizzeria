import {templates, select} from "../settings.js";
import {utils} from "../utils.js";
import AmountWidget from "./AmountWidget.js";

class Booking{
    constructor(element){
        const thisBooking = this;

        thisBooking.render(element);
        thisBooking.initWidgets();
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

    }

    initWidgets(){
        const thisBooking = this;

        thisBooking.peopleAmount = new AmountWidget(thisBooking.dom.peopleAmount);
        thisBooking.hoursAmount = new AmountWidget(thisBooking.dom.hoursAmount);

        thisBooking.dom.peopleAmount.addEventListener('updated', function(){
        });
    
        thisBooking.dom.hoursAmount.addEventListener('updated', function(){
        });
    }
}

export default Booking;