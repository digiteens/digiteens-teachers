// src/Info.js
import React from "react";
import "./App.css";
import { BrowserRouter as Router, Route, Routes, Link } from "react-router-dom";
import Accordion from "react-bootstrap/Accordion";

const Info = () => {
  return (
    <body>
      <div className="col-md-10 container">
        <div className="activity-container">
          <div className="col-md-12 row row-custom justify-content-center mb-8">
            <h3 className="display-5 welcome">
              Info
            </h3>
          </div>
          <p>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla quam
            velit, vulputate eu pharetra nec, mattis ac neque. Duis vulputate
            commodo lectus, ac blandit elit tincidunt id. Sed rhoncus, tortor
            sed eleifend tristique, tortor mauris molestie elit, et lacinia
            ipsum quam nec dui. Quisque nec mauris sit amet elit iaculis pretium
            sit amet quis magna. Aenean velit odio, elementum in tempus ut,
            vehicula eu diam. Pellentesque rhoncus aliquam mattis.
          </p>
          <p>
            Ut vulputate eros sed felis sodales nec vulputate justo hendrerit.
            Vivamus varius pretium ligula, a aliquam odio euismod sit amet.
            Quisque laoreet sem sit amet orci ullamcorper at ultricies metus
            viverra. Pellentesque arcu mauris, malesuada quis ornare accumsan,
            blandit sed diam.
          </p>
          <p>
            Ut vulputate eros sed felis sodales nec vulputate justo hendrerit.
            Vivamus varius pretium ligula, a aliquam odio euismod sit amet.
            Quisque laoreet sem sit amet orci ullamcorper at ultricies metus
            viverra. Pellentesque arcu mauris, malesuada quis ornare accumsan,
            blandit sed diam.
          </p>
          <p>
            Ut vulputate eros sed felis sodales nec vulputate justo hendrerit.
            Vivamus varius pretium ligula, a aliquam odio euismod sit amet.
            Quisque laoreet sem sit amet orci ullamcorper at ultricies metus
            viverra. Pellentesque arcu mauris, malesuada quis ornare accumsan,
            blandit sed diam.
          </p>
          
        </div>
      </div>

      <script src="https://code.jquery.com/jquery-3.5.1.slim.min.js"></script>
      <script src="https://cdn.jsdelivr.net/npm/bootstrap@4.5.2/dist/js/bootstrap.bundle.min.js"></script>
    </body>
  );
};

export default Info;
