*** Settings ***
Documentation     Capture screenshots related to cloud.upbound.io account creation.
Resource    ../resources/register.robot
Resource    ../resources/common.robot

*** Test Cases ***
Capture Create Account
    [Documentation]    Capture the screenshots involved in creating a user account
    Open Browser To Login Page
    Capture Sign Up    register/signup.png
    Capture Sign Up Form    register/completed_form.png
    Capture Choose Username    register/choose_username.png
    Capture Confirm Pin    register/confirm_pin.png
    [Teardown]    Close All Browsers