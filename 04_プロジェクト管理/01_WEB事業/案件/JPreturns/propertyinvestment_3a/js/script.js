"use strict";



//  =================== scroll top ===================



const ctaBtns = document.querySelectorAll(".cta_fixed_btn");
const ctaBgs = document.querySelectorAll(".cta_fixed");
const spFixedBtn = document.getElementById("sp_fixedBtn");
var target = document.getElementById("hide-trigger");





/* 元のｊS
window.addEventListener("scroll", function () {
  if (window.scrollY > 100) {
    ctaBtns.forEach((ctaBtn) => ctaBtn.classList.add("is-active"));
    ctaBgs.forEach((ctaBg) => ctaBg.classList.add("is-active"));
  } else {
    ctaBtns.forEach((ctaBtn) => ctaBtn.classList.remove("is-active"));
    ctaBgs.forEach((ctaBg) => ctaBg.classList.remove("is-active"));
  }
});

*/

window.addEventListener("scroll", function () {

  if (!target) return; // 要素がない場合のエラー回避
  const currentTargetTop = target.getBoundingClientRect().top + window.pageYOffset - 700;
  const currentScroll = window.scrollY;


  if (currentScroll > 100) {
    ctaBtns.forEach((ctaBtn) => ctaBtn.classList.add("is-active"));
    ctaBgs.forEach((ctaBg) => ctaBg.classList.add("is-active"));


    if  ( currentScroll >  currentTargetTop )  {
      console.log(currentScroll);
    ctaBtns.forEach((ctaBtn) => ctaBtn.classList.remove("is-active"));
    ctaBgs.forEach((ctaBg) => ctaBg.classList.remove("is-active"));
    } 

  } else {
   
    ctaBtns.forEach((ctaBtn) => ctaBtn.classList.remove("is-active"));
    ctaBgs.forEach((ctaBg) => ctaBg.classList.remove("is-active"));
  }
  
        
  
});


//  =================== animation ===================
const checkAnimation = (els) => {
  els.forEach((el) => {
    if (el.isIntersecting) {
      el.target.classList.add("is-animated");
    }
  });
};
const anmOpt = { rootMargin: "0% 0% -5%", threshold: 0 };
const anmObserver = new IntersectionObserver(checkAnimation, anmOpt);
const slideUp = document.querySelectorAll(".slideUp");

window.addEventListener("load", () => {
  slideUp.forEach((animation) => {
    anmObserver.observe(animation);
  });
});

//  =================== dialog ===================
const dialog = document.querySelector("dialog");

const open = document.querySelector(".dialog_open");
open.addEventListener("click", function () {
  dialog.showModal();
  dialog.classList.add("show");
});

const close = document.querySelector(".dialog_close");
close.addEventListener("click", function () {
  closeDialog();
});

dialog.addEventListener("click", (event) => {
  if (event.target.closest(".dialog_inner") === null) {
    closeDialog();
  }
});

function closeDialog() {
  dialog.classList.remove("show");
  setTimeout(() => dialog.close(), 500);
}

// フォームのURLにパラメーターを引継ぎ
document.addEventListener("DOMContentLoaded", function () {
  const param = window.location.search; 
  const paramLinkElements = document.querySelectorAll(".p-parameter-link");
  const lpParam = "?lp=mens_soudan_afni5"; 

  paramLinkElements.forEach(function (obj) {
    const link = obj.getAttribute("href");
    let newUrl; 

    if (param) {
      newUrl = link + lpParam + param.replace("?", "&");
    } else {
      newUrl = link + lpParam;
    }

    obj.setAttribute("href", newUrl);
  });
});

//  =================== chatbot ===================
document.addEventListener("DOMContentLoaded", function () {
  const floatingBtn = document.querySelector(".js-cta-floating");
  const chatbot = document.querySelector(".js-chatbot");
  const chatbotCloseBtn = document.querySelector(".js-chatbot-close-btn");
  const chatbotLinks = document.querySelectorAll(".js-chatbot-link");

  floatingBtn.addEventListener("click", function () {
    chatbot.classList.remove("is-close");
    chatbot.classList.add("is-open");
    floatingBtn.classList.add("is-hidden");
  });

  chatbotCloseBtn.addEventListener("click", function () {
    chatbot.classList.remove("is-open");
    chatbot.classList.add("is-close");
    floatingBtn.classList.remove("is-hidden");
  });

  chatbotLinks.forEach((link) => {
    link.addEventListener("click", function (e) {
      if (window.innerWidth > 768) {
        e.preventDefault();
        floatingBtn.click();
      }
    });
  });
});

// 親のクエリを引き継ぐ
document.addEventListener("DOMContentLoaded", () => {
  const iframe = document.getElementById("ctaIframe");
  const query = window.location.search;
  const baseUrl =
    "https://chatbot.jpreturns.com/consultation/?lp=mens_soudan_afni5";
  const iframeUrl = query
    ? baseUrl + "&" + query.substring(1) // 先頭の「?」を除いて連結
    : baseUrl; // クエリがない場合はそのまま
  iframe.src = iframeUrl;
});












// PC用の追尾ボタン
document.addEventListener("scroll", () => {
  const button = document.querySelector(".js-cta-floating");
 

   if (!target) return; // 要素がない場合のエラー回避
  const currentTargetTop = target.getBoundingClientRect().top + window.pageYOffset - 700;
  const currentScroll = window.scrollY;


  
  if (window.scrollY > 450) {
    button.classList.add("is-visible");

    //フッター近くのCTAに近づいたら消す
    if  ( currentScroll >  currentTargetTop )  {
      button.classList.remove("is-visible");
    }  
   
  } else {
      button.classList.remove("is-visible");
  }


});
