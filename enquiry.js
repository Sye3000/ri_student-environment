/* RI Student Environment - Part 3 Enquiry Form */

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("enquiryForm");
    const response = document.getElementById("enquiry-response");

    if (!form || !response) return;

    const guidance = {
        Service:
            "Service costs, requirements and availability depend on the service and campus. The team will need to confirm any fees, available dates and conditions.",
        Product:
            "Product prices and stock levels are not live in this demonstration. Ask the team to confirm the current price, availability and collection or delivery arrangements.",
        Volunteer:
            "Volunteer opportunities depend on programme needs, campus capacity and dates. The team can advise on current opportunities and any participation requirements.",
        Sponsorship:
            "Sponsorship arrangements can be discussed according to the programme, event and proposed contribution. The team can provide further details about suitable options."
    };

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const name = document.getElementById("enquiry-name").value.trim();
        const email = document.getElementById("enquiry-email").value.trim();
        const category = document.getElementById("enquiry-category").value;
        const interest = document.getElementById("enquiry-interest").value.trim();
        const message = document.getElementById("enquiry-message").value.trim();
        const button = form.querySelector('button[type="submit"]');

        if (name.length < 2 || interest.length < 2 || message.length < 20) {
            response.textContent =
                "Please check your details. Your name and subject must contain at least 2 characters, and your message at least 20 characters.";
            response.className = "enquiry-response enquiry-error";
            response.focus();
            return;
        }

        button.disabled = true;
        button.textContent = "Submitting...";
        response.replaceChildren();
        response.className = "enquiry-response";

        const subject = `${category} enquiry: ${interest}`;
        const emailBody = [
            `Name: ${name}`,
            `Email: ${email}`,
            `Category: ${category}`,
            `Enquiry about: ${interest}`,
            "",
            message
        ].join("\n");

        let submitted = false;

        try {
            await RI_API.request("/api/contact", {
                method: "POST",
                body: JSON.stringify({
                    full_name: name,
                    email,
                    subject,
                    message: emailBody
                })
            });
            submitted = true;
        } catch (error) {
            submitted = false;
        }

        const heading = document.createElement("h3");
        heading.textContent = submitted
            ? "Your enquiry reached the website demo service"
            : "Your enquiry is ready to send";

        const explanation = document.createElement("p");
        explanation.textContent = submitted
            ? "The demo endpoint accepted the submission. It does not send email automatically. Use the email link below to send your request to the team."
            : "The website could not submit the enquiry automatically. You can still send it directly to the team.";

        const guidanceText = document.createElement("p");
        guidanceText.textContent = guidance[category];

        const emailLink = document.createElement("a");
        emailLink.className = "form-mail-link";
        emailLink.textContent = "Open your email application to send this enquiry";
        emailLink.href =
            `mailto:support@ristudentenvironment.co.za?${new URLSearchParams({
                subject: `[RI Student Environment] ${subject}`,
                body: emailBody
            }).toString()}`;

        response.append(heading, explanation, guidanceText, emailLink);
        response.classList.add(submitted ? "enquiry-success" : "enquiry-error");
        response.focus();

        button.disabled = false;
        button.textContent = "Submit Enquiry";
    });
});
