*** Settings ***
Documentation     Resource file providing common methods for Upbound
Library           SeleniumLibrary
Library           OperatingSystem

*** Keywords ***
Login to Upbound
    [Arguments]    ${username}    ${password}    ${size}=1700,2050
    [Documentation]     Pass login information to the Upbound login page and login. Username and password is required
    Open Browser To Login Page    ${size}
    Input Login Credentials    ${username}    ${password}
    Click Login

Open Browser To Login Page
    [Arguments]    ${size}=1700,2050
    [Documentation]    Create a browser, go to Upbound login and wait until it's loaded.
    Create a Browser    ${size}
    Go To     https://accounts.upbound.io/register
    # Wait for the whole page to load
    Wait Until Element Is Visible    id:signup_button-email

Input Login Credentials
    [Arguments]    ${username}    ${password}
    [Documentation]     Input the username and password to the Upbound login page.
    Get Environment Variables
    Input Text     id    ${username}
    Input Text     password   ${password}

Click Login
    [Documentation]    Click the "login" button on the Upbound login page.
    Click Button    auth_button-login
    Wait Until Element Contains    class:ehhnx060    Create New Control Plane
    Wait Until Element Is Visible    class:e1qqtum60
    Run Keyword And Ignore Error    Click Button    class:css-10twlew

Create a Browser
    [Arguments]    ${size}=1700,2050
    [Documentation]    Create a Chrome browswer set to screenshot standards. Custom window sizes are optionally supported.
    # To make this portable we need a custom Chrome driver location
    # Also set the window size and use headless mode
    ${chrome_options} =  Evaluate  selenium.webdriver.ChromeOptions()
    Call Method    ${chrome_options}    add_argument    --binary-location\=""../venv/bin/chromedriver"
    Call Method    ${chrome_options}    add_argument    --window-size\=${size}
    # Comment out the next line to view the windows and operations.
    Call Method    ${chrome_options}    add_argument    --headless
    Create WebDriver    Chrome    chrome_options=${chrome_options}
    Set Selenium Speed    0
    # Assumes robot framework is being run from the root of docs/
    Set Screenshot Directory    ./static/images
    # Don't have Selenium capture screenshots on failure.
    Register Keyword To Run On Failure      NONE

Click User Menu
    # Click the round thingy in the bottom left
    Click Element    user-btn