const revealItems = document.querySelectorAll(".reveal");
const toast = document.querySelector(".toast");
const hero = document.querySelector(".hero");
const manTrack = document.querySelector(".hero__man-track");
const heroVisual = document.querySelector(".hero__visual");
const heroFade = document.querySelector(".hero__fade");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

const preventHangingShortWords = (root = document.body) => {
  const shortWords = "(?:для|при|без|под|над|из|за|на|не|но|об|от|по|со|во|до|а|в|и|к|о|с|у)";
  const pattern = new RegExp(
    `(^|[\\s\\u00A0(\\[«„\"—–-])(${shortWords})[\\t ]+(?=[А-Яа-яЁёA-Za-z0-9«„\"])`,
    "gim"
  );
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const textNodes = [];

  while (walker.nextNode()) {
    const node = walker.currentNode;
    const parent = node.parentElement;
    if (!parent || parent.closest("script, style, textarea, input, option")) continue;
    textNodes.push(node);
  }

  textNodes.forEach((node) => {
    node.nodeValue = node.nodeValue.replace(pattern, "$1$2\u00A0");
  });
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

revealItems.forEach((item) => observer.observe(item));

if (hero && !reduceMotion.matches) {
  let ticking = false;

  const updateHeroMotion = () => {
    const heroRect = hero.getBoundingClientRect();
    const progress = Math.min(1, Math.max(0, -heroRect.top / heroRect.height));

    if (manTrack) {
      const manShift = progress * 88;
      manTrack.style.setProperty("--man-scroll-x", `${manShift.toFixed(1)}px`);
    }

    if (heroVisual) {
      const parallaxShift = progress * 62;
      heroVisual.style.setProperty("--hero-parallax-y", `${parallaxShift.toFixed(1)}px`);
    }

    if (heroFade) {
      const fadeOpacity = 0.08 + progress * 0.92;
      heroFade.style.setProperty("--hero-fade-opacity", fadeOpacity.toFixed(3));
    }

    ticking = false;
  };

  const requestHeroUpdate = () => {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(updateHeroMotion);
  };

  updateHeroMotion();
  window.addEventListener("scroll", requestHeroUpdate, { passive: true });
  window.addEventListener("resize", requestHeroUpdate);
}

const numbersStack = document.querySelector(".numbers-stack");
const numbersSticky = numbersStack?.querySelector(".numbers-stack__sticky");
const numbersMan = numbersStack?.querySelector(".numbers-stack__man");
const stackCards = Array.from(numbersStack?.querySelectorAll("[data-stack-card]") || []);

if (numbersStack && numbersSticky && stackCards.length && !reduceMotion.matches) {
  let stackTicking = false;
  let tabletProgress = 0;
  let tabletTouchY = 0;

  const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
  const mix = (from, to, progress) => from + (to - from) * progress;
  const easeOut = (progress) => 1 - Math.pow(1 - progress, 3);
  const isTabletStack = () =>
    window.innerWidth >= 700 &&
    window.innerWidth <= 1100 &&
    window.innerHeight >= 900;
  const isFourKStack = () => window.innerWidth >= 1800;
  const isControlledStack = () => isTabletStack() || isFourKStack();

  const setStackHeight = () => {
    const stickyHeight = numbersSticky.getBoundingClientRect().height || window.innerHeight;
    if (isControlledStack()) {
      numbersStack.style.height = `${stickyHeight}px`;
      return;
    }
    const travelPerCard = Math.max(480, stickyHeight * 0.78);
    numbersStack.style.height = `${stickyHeight + travelPerCard * (stackCards.length - 1)}px`;
  };

  const updateNumbersStack = () => {
    const sectionRect = numbersStack.getBoundingClientRect();
    const viewportHeight = numbersSticky.getBoundingClientRect().height || window.innerHeight;
    const scrollDistance = Math.max(1, numbersStack.offsetHeight - viewportHeight);
    const progress = isControlledStack()
      ? tabletProgress
      : clamp(-sectionRect.top / scrollDistance);
    const cardStyles = getComputedStyle(numbersStack);
    const headerHeight = parseFloat(cardStyles.getPropertyValue("--stack-header-height")) || 76;
    const stackGap = Math.min(44, headerHeight * 0.58);
    const steps = stackCards.length - 1;
    const entranceY = Math.max(500, viewportHeight * 0.78);

    stackCards.forEach((card, index) => {
      if (index === 0) {
        card.style.transform = "translate3d(0, 0, 0) rotate(0deg)";
        card.style.zIndex = "1";
        return;
      }

      const localProgress = easeOut(clamp(progress * steps - (index - 1)));
      const direction = index % 2 === 0 ? 1 : -1;
      const x = mix(direction * 72, 0, localProgress);
      const y = mix(entranceY + index * 55, index * stackGap, localProgress);
      const rotation = mix(direction * 5.5, 0, localProgress);

      card.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0) rotate(${rotation.toFixed(2)}deg)`;
      card.style.zIndex = String(index + 1);
    });

    if (numbersMan) {
      const manX = mix(-10, 12, progress);
      numbersMan.style.transform = `translate3d(${manX.toFixed(2)}px, 0, 0)`;
    }

    stackTicking = false;
  };

  const requestStackUpdate = () => {
    if (stackTicking) return;
    stackTicking = true;
    window.requestAnimationFrame(updateNumbersStack);
  };

  const refreshNumbersStack = () => {
    setStackHeight();
    requestStackUpdate();
  };

  const updateTabletProgress = (delta) => {
    if (!isControlledStack()) return false;
    const nextProgress = clamp(tabletProgress + delta / 1900);
    if (nextProgress === tabletProgress) return false;
    tabletProgress = nextProgress;
    requestStackUpdate();
    return true;
  };

  numbersStack.addEventListener("wheel", (event) => {
    if (updateTabletProgress(event.deltaY)) event.preventDefault();
  }, { passive: false });

  numbersStack.addEventListener("touchstart", (event) => {
    tabletTouchY = event.touches[0]?.clientY || 0;
  }, { passive: true });

  numbersStack.addEventListener("touchmove", (event) => {
    const currentY = event.touches[0]?.clientY || tabletTouchY;
    const delta = tabletTouchY - currentY;
    tabletTouchY = currentY;
    if (updateTabletProgress(delta * 2.4)) event.preventDefault();
  }, { passive: false });

  refreshNumbersStack();
  window.addEventListener("scroll", requestStackUpdate, { passive: true });
  window.addEventListener("resize", refreshNumbersStack);
}

const legacyCarousel = document.querySelector(".legacy-about__carousel");
const legacyTrack = legacyCarousel?.querySelector(".legacy-about__track--first");

if (legacyCarousel && legacyTrack) {
  let carouselResizeFrame = 0;
  let legacyTrackWidth = 0;

  const syncLegacyCarousel = () => {
    window.cancelAnimationFrame(carouselResizeFrame);
    carouselResizeFrame = window.requestAnimationFrame(() => {
      const trackWidth = Math.ceil(legacyTrack.getBoundingClientRect().width);
      if (trackWidth === legacyTrackWidth && legacyCarousel.classList.contains("is-ready")) return;
      legacyTrackWidth = trackWidth;
      legacyCarousel.classList.remove("is-ready");
      legacyCarousel.style.setProperty("--legacy-marquee-width", `${trackWidth}px`);
      legacyCarousel.style.setProperty("--legacy-marquee-negative", `${-trackWidth}px`);
      void legacyCarousel.offsetWidth;
      if (!reduceMotion.matches) legacyCarousel.classList.add("is-ready");
    });
  };

  legacyCarousel.querySelectorAll("img").forEach((image) => {
    if (!image.complete) image.addEventListener("load", syncLegacyCarousel, { once: true });
  });

  syncLegacyCarousel();
  window.addEventListener("resize", syncLegacyCarousel);

  if ("ResizeObserver" in window) {
    const legacyCarouselObserver = new ResizeObserver(syncLegacyCarousel);
    legacyCarouselObserver.observe(legacyTrack);
  }
}

const partnershipCards = document.querySelector(".partnership__cards");
const partnershipModal = document.querySelector("[data-partnership-modal]");
const partnershipDialog = partnershipModal?.querySelector(".partnership-modal__dialog");
const partnershipForm = partnershipModal?.querySelector("[data-partnership-form]");
const selectedPackage = partnershipModal?.querySelector("[data-selected-package]");
const packageInput = partnershipModal?.querySelector("[data-package-input]");
const partnershipOpeners = Array.from(document.querySelectorAll("[data-open-partnership]"));
const partnershipClosers = Array.from(document.querySelectorAll("[data-close-partnership]"));
const contactForms = Array.from(document.querySelectorAll("form[data-form], form[data-partnership-form]"));
const consentStates = new WeakMap();
const legalModals = Array.from(document.querySelectorAll("[data-legal-modal]"));
const phoneInputs = Array.from(document.querySelectorAll("input[type='tel'][name='phone']"));
let lastPartnershipTrigger = null;
let lastLegalTrigger = null;

const getRussianPhoneDigits = (value) => {
  let digits = value.replace(/\D/g, "");

  if (digits.startsWith("8") || digits.startsWith("7")) {
    digits = digits.slice(1);
  }

  return digits.slice(0, 10);
};

const formatRussianPhone = (digits) => {
  if (!digits) return "";

  let formatted = "+7";
  if (digits.length > 0) formatted += ` (${digits.slice(0, 3)}`;
  if (digits.length >= 3) formatted += ")";
  if (digits.length > 3) formatted += ` ${digits.slice(3, 6)}`;
  if (digits.length > 6) formatted += `-${digits.slice(6, 8)}`;
  if (digits.length > 8) formatted += `-${digits.slice(8, 10)}`;
  return formatted;
};

const validateRussianPhone = (input) => {
  const digits = getRussianPhoneDigits(input.value);
  let message = "";

  if (input.value && digits.length !== 10) {
    message = "Введите номер полностью: +7 (999) 123-45-67";
  } else if (digits.length === 10 && !/^[3-9]/.test(digits)) {
    message = "Введите корректный код российского номера.";
  } else if (digits.length === 10 && /^(\d)\1{9}$/.test(digits)) {
    message = "Введите корректный номер телефона.";
  }

  input.setCustomValidity(message);
  return !message;
};

phoneInputs.forEach((input) => {
  input.addEventListener("focus", () => {
    if (!input.value) input.value = "+7 (";
  });

  input.addEventListener("input", () => {
    const digits = getRussianPhoneDigits(input.value);
    input.value = formatRussianPhone(digits);
    validateRussianPhone(input);
  });

  input.addEventListener("blur", () => {
    const digits = getRussianPhoneDigits(input.value);
    if (!digits) input.value = "";
    validateRussianPhone(input);
  });

  input.addEventListener("paste", (event) => {
    event.preventDefault();
    const pastedValue = event.clipboardData?.getData("text") || "";
    const digits = getRussianPhoneDigits(pastedValue);
    input.value = formatRussianPhone(digits);
    validateRussianPhone(input);
  });
});

const validateFormPhones = (form) => {
  const formPhoneInputs = Array.from(form.querySelectorAll("input[type='tel'][name='phone']"));

  return formPhoneInputs.every((input) => {
    const digits = getRussianPhoneDigits(input.value);
    input.value = formatRussianPhone(digits);
    return validateRussianPhone(input);
  });
};

const syncModalLock = () => {
  const hasOpenModal =
    partnershipModal?.classList.contains("is-open") ||
    legalModals.some((modal) => modal.classList.contains("is-open"));
  document.body.classList.toggle("is-modal-open", Boolean(hasOpenModal));
};

contactForms.forEach((form, index) => {
  const submitButton = form.querySelector("button[type='submit'], input[type='submit']");
  if (!submitButton || form.querySelector("[data-consent-checkbox]")) return;

  const honeypot = document.createElement("input");
  honeypot.type = "text";
  honeypot.name = "website";
  honeypot.tabIndex = -1;
  honeypot.autocomplete = "off";
  honeypot.className = "form-honeypot";
  honeypot.setAttribute("aria-hidden", "true");
  form.append(honeypot);

  const consentId = `form-consent-${index + 1}`;
  const consent = document.createElement("div");
  consent.className = "form-consent";
  consent.innerHTML = `
    <div class="form-consent__row">
      <input id="${consentId}" type="checkbox" name="personal_data_consent" required data-consent-checkbox>
      <label class="form-consent__box" for="${consentId}" aria-label="Дать согласие"></label>
      <p>
        <span class="form-consent__line">Я даю <button type="button" data-open-legal="consent">согласие на обработку персональных данных</button></span>
        <span class="form-consent__line">и принимаю условия <button type="button" data-open-legal="privacy">политики конфиденциальности</button>.</span>
      </p>
    </div>
    <p class="form-consent__error" aria-live="polite">Поставьте галочку, чтобы отправить заявку.</p>
  `;
  form.insertBefore(consent, submitButton);

  const checkbox = consent.querySelector("[data-consent-checkbox]");
  const error = consent.querySelector(".form-consent__error");
  const updateConsentState = () => {
    const isChecked = checkbox.checked;
    submitButton.classList.toggle("is-consent-disabled", !isChecked);
    submitButton.setAttribute("aria-disabled", String(!isChecked));
    if (isChecked) {
      consent.classList.remove("is-error");
      error.textContent = "";
    }
  };

  checkbox.addEventListener("change", updateConsentState);
  consentStates.set(form, { checkbox, consent, error, submitButton, updateConsentState });
  updateConsentState();
});

const validateFormConsent = (form) => {
  const state = consentStates.get(form);
  if (!state || state.checkbox.checked) return true;
  state.consent.classList.add("is-error");
  state.error.textContent = "Поставьте галочку, чтобы отправить заявку.";
  state.checkbox.focus({ preventScroll: false });
  return false;
};

const resetFormConsent = (form) => {
  const state = consentStates.get(form);
  if (!state) return;
  state.consent.classList.remove("is-error");
  state.error.textContent = "";
  state.updateConsentState();
};

const goToThankYouPage = (form) => {
  const name = form.querySelector("[name='name']")?.value.trim() || "";

  try {
    if (name) sessionStorage.setItem("ekmLeadName", name);
    else sessionStorage.removeItem("ekmLeadName");
  } catch {
    // The thank-you page gracefully falls back to a generic greeting.
  }

  window.location.href = "thank-you.html";
};

const getFormStatus = (form) => {
  let status = form.querySelector(".form-status");
  if (status) return status;

  status = document.createElement("p");
  status.className = "form-status";
  status.setAttribute("aria-live", "polite");
  form.append(status);
  return status;
};

const setFormStatus = (form, message = "", type = "") => {
  const status = getFormStatus(form);
  status.textContent = message;
  status.classList.toggle("is-visible", Boolean(message));
  status.classList.toggle("is-error", type === "error");
  status.classList.toggle("is-success", type === "success");
};

const parseFormResponse = async (response) => {
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) return response.json();

  const text = await response.text();
  return {
    success: false,
    message: text.trim() || "Сервер вернул некорректный ответ.",
  };
};

const submitLeadForm = async (form) => {
  const submitButton = form.querySelector("button[type='submit'], input[type='submit']");
  const originalButtonText = submitButton?.value || submitButton?.textContent || "";
  const formData = new FormData(form);
  const query = new URLSearchParams(window.location.search);

  formData.set("form_name", form.dataset.formName || "Форма на сайте");
  formData.set("page_url", window.location.href);
  ["utm_source", "utm_medium", "utm_campaign"].forEach((key) => {
    const value = query.get(key);
    if (value) formData.set(key, value);
  });

  setFormStatus(form);
  form.setAttribute("aria-busy", "true");
  if (submitButton) {
    submitButton.disabled = true;
    submitButton.classList.add("is-loading");
    if ("value" in submitButton && submitButton.tagName === "INPUT") {
      submitButton.value = "Отправляем...";
    } else {
      submitButton.textContent = "Отправляем...";
    }
  }

  try {
    if (window.location.protocol === "file:") {
      throw new Error("Отправка заявок заработает после загрузки сайта на PHP-хостинг.");
    }

    const response = await fetch("php/formProcessor.php", {
      method: "POST",
      headers: { "X-Requested-With": "XMLHttpRequest" },
      body: formData,
    });
    const result = await parseFormResponse(response);

    if (!response.ok || !result.success) {
      throw new Error(result.message || "Не удалось отправить заявку.");
    }

    setFormStatus(form, "Заявка отправлена. Переходим на страницу «Спасибо»…", "success");
    goToThankYouPage(form);
    return true;
  } catch (error) {
    setFormStatus(
      form,
      error instanceof Error ? error.message : "Не удалось отправить заявку. Попробуйте ещё раз.",
      "error"
    );
    return false;
  } finally {
    form.removeAttribute("aria-busy");
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.classList.remove("is-loading");
      if ("value" in submitButton && submitButton.tagName === "INPUT") {
        submitButton.value = originalButtonText;
      } else {
        submitButton.textContent = originalButtonText;
      }
    }
  }
};

const closeLegalModal = (modal = legalModals.find((item) => item.classList.contains("is-open"))) => {
  if (!modal?.classList.contains("is-open")) return;
  modal.classList.remove("is-open");
  modal.setAttribute("aria-hidden", "true");
  syncModalLock();
  lastLegalTrigger?.focus();
  lastLegalTrigger = null;
};

const openLegalModal = (trigger) => {
  const modal = legalModals.find((item) => item.dataset.legalModal === trigger.dataset.openLegal);
  if (!modal) return;
  lastLegalTrigger = trigger;
  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");
  syncModalLock();
  window.requestAnimationFrame(() => modal.querySelector(".legal-modal__dialog")?.focus());
};

document.querySelectorAll("[data-open-legal]").forEach((trigger) => {
  trigger.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    openLegalModal(trigger);
  });
});

document.querySelectorAll("[data-close-legal]").forEach((trigger) => {
  trigger.addEventListener("click", () => closeLegalModal(trigger.closest("[data-legal-modal]")));
});

preventHangingShortWords();

const closePartnershipModal = () => {
  if (!partnershipModal?.classList.contains("is-open")) return;
  partnershipModal.classList.remove("is-open");
  partnershipModal.setAttribute("aria-hidden", "true");
  syncModalLock();
  lastPartnershipTrigger?.focus();
};

const openPartnershipModal = (trigger) => {
  if (!partnershipModal) return;
  const card = trigger.closest("[data-package]");
  const packageName = card?.dataset.package || "Пакет партнёрства";
  lastPartnershipTrigger = trigger;
  if (selectedPackage) selectedPackage.textContent = packageName;
  if (packageInput) packageInput.value = packageName;
  partnershipModal.classList.add("is-open");
  partnershipModal.setAttribute("aria-hidden", "false");
  syncModalLock();
  window.requestAnimationFrame(() => partnershipForm?.querySelector("input[name='name']")?.focus());
};

partnershipOpeners.forEach((button) => {
  button.addEventListener("click", () => openPartnershipModal(button));
});

partnershipClosers.forEach((button) => {
  button.addEventListener("click", closePartnershipModal);
});

document.addEventListener("keydown", (event) => {
  const openLegalModalElement = legalModals.find((modal) => modal.classList.contains("is-open"));
  const activeDialog = openLegalModalElement?.querySelector(".legal-modal__dialog") ||
    (partnershipModal?.classList.contains("is-open") ? partnershipDialog : null);

  if (event.key === "Escape") {
    if (openLegalModalElement) closeLegalModal(openLegalModalElement);
    else closePartnershipModal();
    return;
  }

  if (event.key !== "Tab" || !activeDialog) return;

  const focusable = Array.from(activeDialog.querySelectorAll("button, input, textarea, [href], [tabindex='0']"))
    .filter((element) => !element.disabled);
  if (!focusable.length) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
});

if (partnershipForm) {
  partnershipForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!validateFormConsent(partnershipForm)) return;
    if (!validateFormPhones(partnershipForm)) {
      partnershipForm.querySelector("input[type='tel'][name='phone']")?.reportValidity();
      return;
    }
    if (!partnershipForm.reportValidity()) return;
    await submitLeadForm(partnershipForm);
  });
}

if (partnershipCards && window.matchMedia("(hover: hover) and (pointer: fine)").matches && !reduceMotion.matches) {
  const updatePartnershipTilt = (event) => {
    const rect = partnershipCards.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    partnershipCards.style.setProperty("--partnership-rotate-y", `${(x * 2.8).toFixed(2)}deg`);
    partnershipCards.style.setProperty("--partnership-rotate-x", `${(-y * 2).toFixed(2)}deg`);
  };

  partnershipCards.addEventListener("pointermove", updatePartnershipTilt);
  partnershipCards.addEventListener("pointerleave", () => {
    partnershipCards.style.setProperty("--partnership-rotate-y", "0deg");
    partnershipCards.style.setProperty("--partnership-rotate-x", "0deg");
  });
}

const storeGallery = document.querySelector(".store-gallery");
const storeGallerySticky = storeGallery?.querySelector(".store-gallery__sticky");
const storeGalleryViewport = storeGallery?.querySelector(".store-gallery__viewport");
const storeGalleryTrack = storeGallery?.querySelector(".store-gallery__track");
const storeGallerySlides = Array.from(storeGallery?.querySelectorAll("[data-gallery-slide]") || []);
const storeGalleryCurrent = storeGallery?.querySelector("[data-gallery-current]");
const storeGalleryProgress = storeGallery?.querySelector("[data-gallery-progress]");

if (
  storeGallery &&
  storeGallerySticky &&
  storeGalleryViewport &&
  storeGalleryTrack &&
  storeGallerySlides.length &&
  !reduceMotion.matches
) {
  let galleryFrame = 0;
  let galleryTravel = 0;
  let galleryScrollDistance = 1;
  let galleryActiveIndex = -1;

  const clampGallery = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));

  const updateStoreGallery = () => {
    const sectionRect = storeGallery.getBoundingClientRect();
    const progress = clampGallery(-sectionRect.top / galleryScrollDistance);
    const x = -galleryTravel * progress;
    const activeIndex = Math.min(
      storeGallerySlides.length - 1,
      Math.max(0, Math.round(progress * (storeGallerySlides.length - 1)))
    );

    storeGalleryTrack.style.transform = `translate3d(${x.toFixed(2)}px, 0, 0)`;
    storeGalleryProgress?.style.setProperty("transform", `scaleX(${progress.toFixed(4)})`);

    if (activeIndex !== galleryActiveIndex) {
      galleryActiveIndex = activeIndex;
      storeGallerySlides.forEach((slide, index) => {
        slide.classList.toggle("is-active", index === activeIndex);
      });
      if (storeGalleryCurrent) {
        storeGalleryCurrent.textContent = String(activeIndex + 1).padStart(2, "0");
      }
    }

    galleryFrame = 0;
  };

  const requestStoreGalleryUpdate = () => {
    if (galleryFrame) return;
    galleryFrame = window.requestAnimationFrame(updateStoreGallery);
  };

  const measureStoreGallery = () => {
    const viewportWidth = storeGalleryViewport.getBoundingClientRect().width;
    const stickyHeight = storeGallerySticky.getBoundingClientRect().height || window.innerHeight;
    galleryTravel = Math.max(0, Math.ceil(storeGalleryTrack.scrollWidth - viewportWidth));
    galleryScrollDistance = Math.max(1, galleryTravel);
    storeGallery.style.height = `${Math.ceil(stickyHeight + galleryScrollDistance)}px`;
    requestStoreGalleryUpdate();
  };

  storeGallerySlides.forEach((slide) => {
    const image = slide.querySelector("img");
    if (image && !image.complete) image.addEventListener("load", measureStoreGallery, { once: true });
  });

  measureStoreGallery();
  window.addEventListener("scroll", requestStoreGalleryUpdate, { passive: true });
  window.addEventListener("resize", measureStoreGallery);

  if ("ResizeObserver" in window) {
    const storeGalleryObserver = new ResizeObserver(measureStoreGallery);
    storeGalleryObserver.observe(storeGalleryViewport);
    storeGalleryObserver.observe(storeGalleryTrack);
  }
}

document.querySelectorAll("[data-form]").forEach((form) => {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!validateFormConsent(form)) return;
    if (!validateFormPhones(form)) {
      form.querySelector("input[type='tel'][name='phone']")?.reportValidity();
      return;
    }
    if (!form.reportValidity()) return;

    await submitLeadForm(form);
  });
});
