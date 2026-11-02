/* =========================================================
   RI STUDENT ENVIRONMENT
   Student Dashboard
   ========================================================= */


/* =========================================================
   NOTIFICATIONS
   ========================================================= */

const notificationButton =
    document.querySelector(
        ".notification-button"
    );

const notificationCount =
    document.querySelector(
        ".notification-count"
    );


if (notificationButton) {

    notificationButton.addEventListener(
        "click",
        () => {

            const hasUnreadNotifications =
                notificationCount &&
                !notificationCount.hidden;


            notificationButton.setAttribute(
                "aria-expanded",
                String(
                    Boolean(
                        hasUnreadNotifications
                    )
                )
            );


            notificationButton.title =
                hasUnreadNotifications
                    ? "Notifications marked as read"
                    : "No new notifications";


            if (notificationCount) {

                notificationCount.textContent =
                    "0";

                notificationCount.hidden =
                    true;

            }

        }
    );

}


/* =========================================================
   LOGOUT
   ========================================================= */

const logoutLink =
    document.querySelector(
        ".logout-link"
    );


if (logoutLink) {

    logoutLink.addEventListener(
        "click",
        logoutStudent
    );

}
