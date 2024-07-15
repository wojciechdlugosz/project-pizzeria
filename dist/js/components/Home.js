import {select, templates} from "../settings.js";
import {utils} from "../utils.js";

class Home{
    constructor(element){
        const thisHome = this;

        thisHome.render(element);
        thisHome.initWidgets();
    }

    render(element){
        const thisHome = this;

        thisHome.dom = {};
        thisHome.dom.wrapper = element;

        const generatedHTML = templates.home();
        const generatedDOM = utils.createDOMFromHTML(generatedHTML);
        thisHome.dom.wrapper.appendChild(generatedDOM);

        thisHome.dom.carousel = thisHome.dom.wrapper.querySelector(select.home.carousel);
    }

    initWidgets(){
        const thisHome = this;
        // eslint-disable-next-line no-undef
        setTimeout(function() {
            // eslint-disable-next-line no-undef
            const flkty = new Flickity(thisHome.dom.carousel, {
                cellAlign: 'left',
                contain: true,
                wrapAround: true,
                autoPlay: true,
            });
            console.log(flkty);
        }, 50);
    }
}
export default Home;