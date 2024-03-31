import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { SignupComponent } from "../components";
import { setLoading } from "../redux/loading";
import "./style.scss";

const Signup = () => {
  const { user } = useSelector((state) => state);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate("/");
    } else {
      setTimeout(() => {
        dispatch(setLoading(false));
      }, 1000);
    }
  }, [user, navigate, dispatch]);

  return (
    <div className="Auth">
      <div className="inner">
        <SignupComponent />
        <div className="bottum">
          <div className="start">
            <a href="https://openai.com/policies/terms-of-use" target="_blank">
              Terms of use
            </a>
          </div>
          <div className="end">
            <a href="https://openai.com/policies/privacy-policy" target="_blank">
              Privacy Policy
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;