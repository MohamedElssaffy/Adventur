const nodemailer = require("nodemailer");
const pug = require("pug");
const { htmlToText } = require("html-to-text");

module.exports = class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.name.includes(" ")
      ? user.name.split(" ")[0]
      : user.name;
    this.url = url;
    this.from = "ma7amad123410000@gmail.com";
  }

  createTransport() {
    if (process.env.NODE_ENV === "production") {
      //  send grid
      return nodemailer.createTransport({
        service: "SendGrid",
        auth: {
          user: process.env.SENDGRID_USER,
          pass: process.env.SENDGRID_PASSWORD,
        },
      });
    }
    return nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      auth: {
        user: "zx7ryceobtr7qeic@ethereal.email",
        pass: "J7PdhjaMMurVTbPVKn",
      },
    });
  }

  send(template, subject) {
    const html = pug.renderFile(
      `${__dirname}/../templates/emails/${template}.pug`,
      {
        firstName: this.firstName,
        url: this.url,
        subject,
      }
    );

    const emailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
      text: htmlToText(html, {
        wordwrap: 250,
      }),
    };

    this.createTransport().sendMail(emailOptions, (err, info) => {
      if (err) {
        console.error(err);
      }
      if (info) {
        console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
      }
    });
  }

  sendWelcom() {
    this.send("welcom", "Welcom to Adventures Family");
  }

  sendResetPassword() {
    this.send("restPassword", "Your Password rest token valid for 1 hour");
  }
};

// const sendEmail = (option) => {
//   const transporter = nodemailer.createTransport({
//     host: "smtp.ethereal.email",
//     port: 587,
//     auth: {
//       user: "zx7ryceobtr7qeic@ethereal.email",
//       pass: "J7PdhjaMMurVTbPVKn",
//     },
//   });

//   const emailOptions = {
//     from: "Mohamed Gamal <hello@mohamed.io>",
//     to: option.email,
//     subject: option.subject,
//     text: option.message,
//   };

//   transporter.sendMail(emailOptions, (err, info) => {
//     if (err) {
//       console.error(err);
//     }
//     if (info) {
//     }
//   });
// };
