*** Settings ***
Documentation     Resource file providing common methods for Upbound
Library           SeleniumLibrary
Library           String
Resource          common.robot

*** Variables ***
${hash}
${org}

*** Keywords ***
Capture Create Organization
    ${hash} =     Generate Random String    chars=[LETTERS]
    ${org} =     Catenate    SEPARATOR=    docs    ${hash}
    # Capture the left nav without the Teams and Robots options
    Capture Element Screenshot    class:css-111qlur    accounts/left-menu-personal.png
    Click User Menu
    # Without the sleep the menu doesn't load completely before the screenshot is taken
    Sleep     1
    # Capture the pop up menu showing account options
    Capture Element Screenshot    class:react-tiny-popover-container    accounts/account-menu-no-org.png
    # Click "Create New Organization"
    Click Element     xpath://*[contains(text(), "Create New Organization")]
    # Wait until the create org screen is visible and fill it in
    Wait Until Element Is Visible    name
    Input Text    name    ExampleOrg
    Input Text    displayName    Example Organization
    # Capture the org screen
    Capture Element Screenshot    class:css-12yosia    accounts/create-new-org.png

Capture Organization Left Menu
    Click User Menu
    Sleep    1
    Capture Element Screenshot    class:react-tiny-popover-container    accounts/account-menu-with-org.png
    # Click "Example Organization"
    Click Element    org-link-docsb118edafc
    # Click "Admin Console"
    Click Element    //span[text()='Admin Console']
    # Wait until "Robots" icon is visible
    Wait Until Element Is Visible    //p[text()='Robots']
    Capture Element Screenshot    class:css-111qlur    accounts/left-menu-organization.png
    # Hide the "Upbound Inc" org
    # Execute Javascript    document.getElementById("org-link-upbound").remove()
    # # Rename the "Upbound Docs" org
    # Execute Javascript     document.evaluate("//*[@id='org-link-upbound-docs']/div/div[2]/span", document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue.textContent="Example Organization"
    # # Replace "Pete Lumbis" with "A. User"
    # Execute Javascript    document.querySelector('.css-1k81wk5').textContent=("A. User")
