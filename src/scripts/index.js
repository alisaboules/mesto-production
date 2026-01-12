/*
  Файл index.js является точкой входа в наше приложение
  и только он должен содержать логику инициализации нашего приложения
  используя при этом импорты из других файлов

  Из index.js не допускается что то экспортировать
*/


import { createCardElement, deleteCard, likeCard } from "./components/card.js";
import { openModalWindow, closeModalWindow, setCloseModalWindowEventListeners } from "./components/modal.js";
import { enableValidation, clearValidation } from "./components/validation.js";
import { getUserInfo, getCardList, setUserInfo, setUserAvatar, addCard, deleteCardAPI, changeLikeCardStatus } from "./components/api.js";

// DOM узлы
const placesWrap = document.querySelector(".places__list");
const profileFormModalWindow = document.querySelector(".popup_type_edit");
const profileForm = profileFormModalWindow.querySelector(".popup__form");
const profileTitleInput = profileForm.querySelector(".popup__input_type_name");
const profileDescriptionInput = profileForm.querySelector(".popup__input_type_description");

const cardFormModalWindow = document.querySelector(".popup_type_new-card");
const cardForm = cardFormModalWindow.querySelector(".popup__form");
const cardNameInput = cardForm.querySelector(".popup__input_type_card-name");
const cardLinkInput = cardForm.querySelector(".popup__input_type_url");

const imageModalWindow = document.querySelector(".popup_type_image");
const imageElement = imageModalWindow.querySelector(".popup__image");
const imageCaption = imageModalWindow.querySelector(".popup__caption");

const openProfileFormButton = document.querySelector(".profile__edit-button");
const openCardFormButton = document.querySelector(".profile__add-button");

const profileTitle = document.querySelector(".profile__title");
const profileDescription = document.querySelector(".profile__description");
const profileAvatar = document.querySelector(".profile__image");

const avatarFormModalWindow = document.querySelector(".popup_type_edit-avatar");
const avatarForm = avatarFormModalWindow.querySelector(".popup__form");
const avatarInput = avatarForm.querySelector(".popup__input");

let currentUserId;

const removeCardPopup = document.querySelector(".popup_type_remove-card");
const removeCardForm = removeCardPopup.querySelector(".popup__form");

let cardIdToDelete = null;
let cardElementToDelete = null;

const cardInfoModalWindow = document.querySelector(".popup_type_info");
const cardInfoModalInfoList = cardInfoModalWindow.querySelector(".popup__info");
const cardInfoModalLikesList = cardInfoModalWindow.querySelector(".popup__list");
const infoTemplate = document.querySelector("#popup-info-definition-template").content;
const userPreviewTemplate = document.querySelector("#popup-info-user-preview-template").content;

const handlePreviewPicture = ({ name, link }) => {
  imageElement.src = link;
  imageElement.alt = name;
  imageCaption.textContent = name;
  openModalWindow(imageModalWindow);
};

const handleProfileFormSubmit = (evt) => {
  evt.preventDefault();
  renderLoading(evt.target, true, "Сохранение...", "Сохранить");
  setUserInfo({
    name: profileTitleInput.value,
    about: profileDescriptionInput.value,
  })
    .then((userData) => {
      profileTitle.textContent = userData.name;
      profileDescription.textContent = userData.about;
      closeModalWindow(profileFormModalWindow);
    })
    .catch((err) => {
      console.log(err);
    })
    .finally(() => {
      renderLoading(evt.target, false, "Сохранение...", "Сохранить");
    });
};

const handleAvatarFromSubmit = (evt) => {
  evt.preventDefault();
  renderLoading(evt.target, true, "Сохранение...", "Сохранить");
  setUserAvatar({avatar: avatarInput.value})
  .then((userData) => {
    profileAvatar.style.backgroundImage = `url(${userData.avatar})`;
    closeModalWindow(avatarFormModalWindow);
  })
  .catch((err) => {
    console.log(err);
  })
  .finally(() => {
    renderLoading(evt.target, false, "Сохранение...", "Сохранить");
  });
};

const handleCardFormSubmit = (evt) => {
  evt.preventDefault();
  renderLoading(evt.target, true, "Создание...", "Создать");
  addCard({ 
    name: cardNameInput.value, 
    link: cardLinkInput.value
  })
    .then((newCard) => {
      placesWrap.prepend(
        createCardElement(newCard, {
          onPreviewPicture: handlePreviewPicture,
          onLikeIcon: handleLikeClick,
          onDeleteCard: handleDeleteClick,
          onInfoClick: handleInfoClick
        },

          currentUserId
        )
      );
      closeModalWindow(cardFormModalWindow);
    })
    .catch((err) => {
      console.log(err);
    })
    .finally(() => {
      renderLoading(evt.target, false, "Создание...", "Создать");
    });
};

// Создание объекта с настройками валидации
const validationSettings = {
  formSelector: ".popup__form",
  inputSelector: ".popup__input",
  submitButtonSelector: ".popup__button",
  inactiveButtonClass: "popup__button_disabled",
  inputErrorClass: "popup__input_type_error",
  errorClass: "popup__error_visible",
};

// включение валидации вызовом enableValidation
// все настройки передаются при вызове
enableValidation(validationSettings);


// EventListeners
profileForm.addEventListener("submit", handleProfileFormSubmit);
cardForm.addEventListener("submit", handleCardFormSubmit);
avatarForm.addEventListener("submit", handleAvatarFromSubmit);

openProfileFormButton.addEventListener("click", () => {
  profileTitleInput.value = profileTitle.textContent;
  profileDescriptionInput.value = profileDescription.textContent;
  clearValidation(profileForm, validationSettings);
  openModalWindow(profileFormModalWindow);
});

profileAvatar.addEventListener("click", () => {
  avatarForm.reset();
  clearValidation(avatarForm, validationSettings);
  openModalWindow(avatarFormModalWindow);
});

openCardFormButton.addEventListener("click", () => {
  cardForm.reset();
  clearValidation(cardForm, validationSettings);
  openModalWindow(cardFormModalWindow);
});

//настраиваем обработчики закрытия попапов
const allPopups = document.querySelectorAll(".popup");
allPopups.forEach((popup) => {
  setCloseModalWindowEventListeners(popup);
});

Promise.all([getCardList(), getUserInfo()])
  .then(([cards, userData]) => {
    profileTitle.textContent = userData.name;
    profileDescription.textContent = userData.about;
    profileAvatar.style.backgroundImage = `url(${userData.avatar})`;

    currentUserId = userData._id;

    cards.forEach((card) => {
      placesWrap.append(
        createCardElement(card, {
          onPreviewPicture: handlePreviewPicture,
          onLikeIcon: handleLikeClick,
          onDeleteCard: handleDeleteClick,
          onInfoClick: handleInfoClick
        }, currentUserId)
      );
    });
  })
  .catch((err) => {
    console.log(err); 
  });

removeCardForm.addEventListener("submit", (evt) => {
  evt.preventDefault();
  renderLoading(evt.target, true, "Удаление...", "Да");
  deleteCardAPI(cardIdToDelete)
    .then(() => {
      deleteCard(cardElementToDelete);
      closeModalWindow(removeCardPopup);
    })
    .catch((err) => {
      console.log(err);
    })
    .finally(() => {
      renderLoading(evt.target, false, "Удаление...", "Да");
    });
});

const handleDeleteClick = (cardId, cardElement) => {
  cardIdToDelete = cardId;
  cardElementToDelete = cardElement;
  openModalWindow(removeCardPopup);
};

const handleLikeClick = (likeButton, cardId, likeCounter) => {
  const isLiked = likeButton.classList.contains("card__like-button_is-active");

  changeLikeCardStatus(cardId, isLiked)
    .then((updatedCard) => {
      likeCounter.textContent = updatedCard.likes.length;
      likeCard(likeButton);
    })
    .catch((err) => console.log(err));
};

const renderLoading = (form, isLoading, loadingText, defaultText) => {
  const button = form.querySelector(".popup__button");
  button.textContent = isLoading ? loadingText : defaultText;
};

const formatDate = (date) =>
  date.toLocaleDateString("ru-RU", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

const clearContainer = (container) => {
  while (container.firstChild) {
    container.removeChild(container.firstChild);  
  }
};

const createInfoString = function (title, value) {
  const item = infoTemplate.querySelector(".popup__info-item").cloneNode(true);
  item.querySelector(".popup__info-term").textContent = title;
  item.querySelector(".popup__info-description").textContent = value;
  return item;
};

const handleInfoClick = (cardId) => {
  getCardList()
    .then((cards) => {
      const cardData = cards.find((card) => card._id === cardId);
      if (!cardData) return;
      clearContainer(cardInfoModalInfoList);
      clearContainer(cardInfoModalLikesList);
      cardInfoModalInfoList.append(
        createInfoString("Описание:", cardData.name),
        createInfoString("Дата создания:", formatDate(new Date(cardData.createdAt))),
        createInfoString("Владелец:", cardData.owner.name),
        createInfoString("Количество лайков:", cardData.likes.length)
      )
      if (cardData.likes.length) {
        cardData.likes.forEach((user) => {
          const item = userPreviewTemplate.querySelector("li").cloneNode(true);
          item.textContent = user.name,
          cardInfoModalLikesList.append(item);
        })
      }
      openModalWindow(cardInfoModalWindow);
    })
    .catch((err) => {
      console.log(err);
    });
}; 