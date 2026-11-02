# RI Student Environment

## Project Information

- **Project:** RI Student Environment
- **Student:** Leanetsi Mpongwana
- **Module:** Web Development Project
- **Project Phase:** Part 3 — JavaScript, Enhanced Functionality, SEO and Deployment
- **Year:** 2026

---

## 1. Project Overview

RI Student Environment is a student-focused website designed to provide a central digital environment where students can discover programmes, events, student leadership information, community activities, and opportunities for participation.

The website aims to improve access to student-related information while providing a structured, accessible, and responsive environment for student engagement and community interaction.

The project has developed from its initial HTML foundation into a website that incorporates CSS styling, responsive layouts, accessibility improvements, and preparation for further interactive functionality.

## 2. Project Objectives

The main objectives of the project are to:

- Provide students with a central source of information.
- Improve access to student programmes and opportunities.
- Provide information about student events.
- Present information about student leadership and the SRC.
- Encourage communication and community participation.
- Maintain a clear, accessible website structure.
- Provide responsive layouts for different screen sizes.
- Improve navigation and usability.
- Establish a foundation for future interactive functionality.

## 3. Target Users

The primary users of the website are:

- Students
- Student representatives
- Student community groups
- Prospective participants in student programmes

## 4. Website Pages

The website includes the following pages:

1. Home
2. About
3. Programs
4. Events
5. SRC
6. Community
7. Our Impact
8. Join Us
9. Login
10. Contact

## 5. Main Features

The project includes the following website features and development areas:

- Site-wide navigation
- Structured HTML pages
- Semantic HTML5 elements
- Student programme information
- Event information
- SRC information
- Community and organisation information
- Impact information
- Registration interface
- Login interface
- Contact information
- CSS-based visual styling
- Responsive layouts
- Responsive image handling
- Mobile navigation accessibility improvements
- Reduced-motion support
- Page-specific styling
- Foundation for interactive functionality

The implementation of individual features may vary by page and should be verified against the current source code.

## 6. Technologies and Tools

The project uses the following technologies and tools:

- **HTML5:** Page structure and semantic markup
- **CSS3:** Styling, layout, responsive design, and accessibility-related presentation
- **JavaScript:** Interactive functionality where implemented
- **Visual Studio Code:** Development environment
- **Git:** Version control
- **GitHub:** Source-code hosting and project tracking

---

## 7. Responsive Design and Accessibility

Responsive design and accessibility improvements form part of the project's later development work.

### 7.1 Responsive Design Strategy

The stylesheet uses a desktop-first responsive strategy, with media queries intended to adapt page layouts to smaller screens.

Responsive adjustments include:

- Layout changes at defined viewport breakpoints.
- Responsive filter and grid layouts.
- Adjustments to page spacing and component presentation.
- Image sizing intended to prevent unwanted overflow.
- Page-specific styling to support different layouts.
- Improvements to the presentation of content on desktop, tablet, and mobile screens.

The final appearance should be checked at multiple viewport sizes to confirm that layouts remain usable and that no content is clipped or overlaps.

### 7.2 Image Handling

Image-related improvements include:

- Descriptive image filenames where applicable.
- Responsive image markup using `srcset` and `sizes`, where supported by the relevant image elements.
- Explicit image dimensions to help browsers allocate layout space.
- Lazy loading for appropriate below-the-fold images.
- Alternative text for meaningful images.
- Image sizing rules intended to prevent images from overflowing their containers.

Decorative images should be handled appropriately so that they do not create unnecessary noise for assistive technology.

### 7.3 Navigation Accessibility

Navigation improvements include:

- An `aria-expanded` attribute on the hamburger menu control, where implemented.
- Keyboard support for closing the menu with the Escape key, where implemented.
- Clear navigation behaviour across different screen sizes.

Interactive controls should also be tested with a keyboard and checked to ensure that their accessible states reflect their actual behaviour.

### 7.4 Reduced Motion

A CSS `prefers-reduced-motion` media query provides a way to reduce or remove certain animations and transitions for users who have enabled reduced-motion preferences on their devices.

This helps make motion effects more considerate of users who prefer a less animated interface.

### 7.5 Chat Page Viewport Behaviour

The chat page uses the dynamic viewport height unit `100dvh`, where implemented, to better account for changes in the visible viewport on supported mobile browsers.

This can help the chat layout fit the available screen area more effectively than a fixed traditional viewport-height value in some mobile browsing situations.

### 7.6 CSS Organisation

CSS maintenance work includes:

- Removing duplicate style rules where identified.
- Scoping dashboard-related styles to reduce unintended effects on other pages.
- Organising responsive rules.
- Reviewing component-specific styles to reduce conflicts between page layouts.

These changes aim to improve maintainability and reduce unintended styling side effects.

---

## 8. Responsive Testing

The website should be tested at a range of viewport sizes to check layout behaviour, navigation, image scaling, and readability.

Suggested test sizes:

| Device category | Example viewport width | Areas to check |
|---|---:|---|
| Large desktop | 1440px | Main layout, navigation, spacing, and image sizing |
| Laptop | 1024px | Content width, grids, and navigation |
| Tablet | 768px | Responsive layouts, filters, and navigation |
| Mobile | 375px | Overflow, readable text, buttons, and mobile navigation |

These are suggested testing sizes, not a claim that every test has already been completed.

During testing, check for:

- Horizontal scrolling caused by overflowing content.
- Images extending beyond their containers.
- Navigation controls that are difficult to use.
- Text that becomes difficult to read at smaller sizes.
- Grid or filter layouts that fail to adapt.
- Interactive elements that cannot be reached or operated with a keyboard.
- Reduced-motion settings that are respected where relevant.

---

## 9. Part 3 Development Changelog

The following items document the reported responsive design, accessibility, and stylesheet improvements.

- Added or clarified comments describing the responsive design strategy.
- Reviewed responsive filter and grid layouts at different breakpoints.
- Improved global image sizing rules to help prevent overflow.
- Updated chat page viewport-height handling using `100dvh`, where implemented.
- Added reduced-motion handling using `prefers-reduced-motion`, where implemented.
- Improved hamburger navigation accessibility with `aria-expanded` and Escape-key handling, where implemented.
- Removed duplicate CSS rules where identified.
- Scoped dashboard styles to reduce unintended styling effects on other pages.
- Reviewed image filenames and responsive image attributes.
- Used responsive image markup such as `srcset` and `sizes` where appropriate.
- Added explicit image dimensions and lazy loading where appropriate.
- Reviewed image alternative text and general page presentation.

**Note:** This changelog records the reported changes. Confirm each item against the current source code before submitting the project as evidence of completed implementation.

---


### Additional Part 3 implementation and verification

**Dynamic events**
- Added event category support to event submissions and API retrieval.
- Implemented keyword search and category filtering on the Events page.
- Added dynamic category options and result feedback.

**Forms**
- Updated the Contact form with message-type selection and validation.
- Created an Enquiry page covering services, products, volunteering and sponsorship.
- Added category-specific guidance, submission feedback and email composition links.
- The backend currently logs contact submissions; it does not automatically send email.

**Interactive functionality**
- Added a photo lightbox to the existing five-image hiking slideshow.
- Added previous, next, close and keyboard controls.
- The Campus Navigator provides an indoor floor directory, searchable facilities, QR links and printable floor guides. It is not a verified geographical map.

**SEO**
- Added missing meta descriptions to inspected pages.
- Added robots.txt with restrictions for selected private and diagnostic pages.
- Added noindex directives to selected portal pages.

**Testing**
- JavaScript syntax checks passed for app.js, events.js, enquiry.js, hiking-lightbox.js and campus-nav.js.
- Backend health check confirmed MySQL connectivity.
- Local HTTP requests returned status 200 for the Programs, Contact and Enquiry pages.
- Browser testing confirmed that the hiking lightbox and both forms work.
- Event keyword search and category filtering were also tested successfully.

**Outstanding:** Public deployment, sitemap.xml creation after confirming the public domain, and public API configuration remain to be completed.

## 10. Project Structure

The project structure may include the following files and directories:

```text
ri-student-environment/
│
├── index.html
├── about.html
├── programs.html
├── events.html
├── src.html
├── community.html
├── impact.html
├── join-us.html
├── login.html
├── contact.html
│
├── css/
│   └── style.css
│
├── js/
│
├── images/
├── research/
├── wireframes/
│
├── README.md
└── CHANGELOG.md
```

The structure above is illustrative. Update it to match the actual names and locations of files in the GitHub repository, including any additional stylesheets, scripts, or directories.

---

## 11. GitHub Repository and Version Control

The project is maintained using Git and GitHub for source-code management, version control, and project tracking.

**Repository:** [RI Student Environment on GitHub](https://github.com/Sye3000/ri_student-environment)

The repository is intended to contain the website source files, stylesheets, JavaScript files where applicable, project documentation, research materials, wireframes, and development history.

Meaningful commits should be used to record changes during each project phase.

---

## 12. References

Cape Peninsula University of Technology. (n.d.). *Student Activities.* Available at: https://www.cput.ac.za/student/campus-life/activities

Google Chrome Developers. (n.d.). *Use landmarks to improve accessibility.* Available at: https://developer.chrome.com/docs/lighthouse/accessibility/use-landmarks

Rhodes University. (n.d.). *About the SRC.* Available at: https://www.ru.ac.za/studentlife/src/aboutthesrc/

Sol Plaatje University. (n.d.). *Student Life and Development.* Available at: https://www.spu.ac.za/index.php/student-life-and-development/

Sol Plaatje University. (n.d.). *Student Representative Council.* Available at: https://www.spu.ac.za/index.php/student-representative-council/

---

## 13. Project Status

The RI Student Environment project has progressed from its initial planning and HTML foundation to further styling and responsive design improvements.

The current documentation covers the project's purpose, target users, website pages, technology stack, responsive design approach, accessibility-related improvements, and reported stylesheet maintenance.

Before final submission, verify that the repository reflects the final implementation and that all required JavaScript functionality, form validation, SEO metadata, deployment requirements, and project evidence have been completed where required by the Part 3 assessment criteria.
