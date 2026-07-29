import { expect, test } from "@playwright/test";

const STORAGE_KEY = "form-crm:leads:v1";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();
  await expect(page.getByTestId("crm-app")).toHaveAttribute(
    "data-ready",
    "true",
  );
});

test("shows errors for empty required fields", async ({ page }) => {
  await page.getByRole("button", { name: "Сохранить лида" }).click();

  const nameInput = page.getByLabel("Имя клиента");
  const phoneInput = page.getByLabel("Номер телефона");

  await expect(nameInput).toHaveAttribute("required", "");
  await expect(phoneInput).toHaveAttribute("required", "");
  await expect(nameInput).toHaveAttribute("aria-invalid", "true");
  await expect(phoneInput).toHaveAttribute("aria-invalid", "true");
  await expect(nameInput).toBeFocused();
  await expect(page.getByText("Введите имя клиента")).toHaveAttribute(
    "role",
    "alert",
  );
  await expect(page.getByText("Введите номер телефона")).toBeVisible();
  await expect(page.getByTestId("lead-card")).toHaveCount(0);
});

test("creates a lead and restores every value after reload", async ({
  page,
}) => {
  await page.getByLabel("Имя клиента").fill("Анна Смирнова");
  await page.getByLabel("Номер телефона").fill("+7 999 123-45-67");
  await page.getByLabel("Источник лида").selectOption("Тёплый");
  await page.getByLabel("Ответственный").selectOption("МОП");
  await page.getByTestId("spec-requested").click();
  await page.getByRole("button", { name: "Сохранить лида" }).click();

  const card = page.getByTestId("lead-card");
  await expect(card).toContainText("Анна Смирнова");
  await expect(card).toContainText("+7 999 123-45-67");
  await expect(card).toContainText("Тёплый");
  await expect(card).toContainText("МОП");
  await expect(card).toContainText("ТЗ запрошено");
  await expect(card.getByTestId("lead-stage")).toHaveText("Новый лид");

  await page.reload();
  await expect(page.getByTestId("crm-app")).toHaveAttribute(
    "data-ready",
    "true",
  );

  const restoredCard = page.getByTestId("lead-card");
  await expect(restoredCard).toContainText("Анна Смирнова");
  await expect(restoredCard).toContainText("+7 999 123-45-67");
  await expect(restoredCard).toContainText("Тёплый");
  await expect(restoredCard).toContainText("МОП");
  await expect(restoredCard).toContainText("ТЗ запрошено");
  await expect(restoredCard.getByTestId("lead-stage")).toHaveText("Новый лид");

  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth,
  );
  expect(hasHorizontalOverflow).toBe(false);
});

test("selects any stage and persists the update", async ({ page }) => {
  await page.getByLabel("Имя клиента").fill("Иван Петров");
  await page.getByLabel("Номер телефона").fill("+7 900 000-00-00");
  await page.getByRole("button", { name: "Сохранить лида" }).click();

  const card = page.getByTestId("lead-card");
  const stageButton = card.getByRole("button", {
    name: "Изменить этап сделки для Иван Петров",
  });

  await expect(card).toContainText("ТЗ не запрошено");
  await stageButton.click();

  const stageMenu = card.getByRole("listbox", {
    name: "Выберите этап сделки для Иван Петров",
  });
  await expect(stageMenu).toBeVisible();
  await expect(stageMenu.getByRole("option")).toHaveCount(4);
  await stageMenu.getByRole("option", { name: "Отказ" }).click();
  await expect(card.getByTestId("lead-stage")).toHaveText("Отказ");
  await expect(stageMenu).toBeHidden();

  await page.reload();
  const restoredCard = page.getByTestId("lead-card");
  await expect(restoredCard.getByTestId("lead-stage")).toHaveText("Отказ");

  await restoredCard
    .getByRole("button", {
      name: "Изменить этап сделки для Иван Петров",
    })
    .click();
  await restoredCard
    .getByRole("listbox", {
      name: "Выберите этап сделки для Иван Петров",
    })
    .getByRole("option", { name: "Квалифицирован" })
    .click();
  await expect(restoredCard.getByTestId("lead-stage")).toHaveText(
    "Квалифицирован",
  );

  await page.reload();
  await expect(
    page.getByTestId("lead-card").getByTestId("lead-stage"),
  ).toHaveText("Квалифицирован");
});

test("supports the complete keyboard flow", async ({ page }) => {
  await page.getByLabel("Имя клиента").fill("Наталья Волкова");
  await page.getByLabel("Номер телефона").fill("+7 905 777-88-99");

  const specCheckbox = page.getByRole("checkbox", {
    name: "Запрошено ТЗ Клиент ожидает техническое задание",
  });
  await specCheckbox.focus();
  await page.keyboard.press("Space");
  await expect(specCheckbox).toBeChecked();

  const saveButton = page.getByRole("button", { name: "Сохранить лида" });
  await saveButton.focus();
  await page.keyboard.press("Enter");

  const card = page.getByTestId("lead-card");
  await expect(card).toContainText("Наталья Волкова");
  const stageButton = card.getByRole("button", {
    name: "Изменить этап сделки для Наталья Волкова",
  });
  await stageButton.focus();
  await page.keyboard.press("Enter");
  const qualifiedOption = card.getByRole("option", {
    name: "Квалифицирован",
  });
  await qualifiedOption.focus();
  await page.keyboard.press("Enter");
  await expect(card.getByTestId("lead-stage")).toHaveText("Квалифицирован");
});

test("ignores corrupt and unexpected stored JSON", async ({ page }) => {
  await page.evaluate(
    ({ key }) => window.localStorage.setItem(key, "{not-json"),
    { key: STORAGE_KEY },
  );
  await page.reload();

  await expect(page.getByTestId("crm-app")).toHaveAttribute(
    "data-ready",
    "true",
  );
  await expect(page.getByTestId("lead-card")).toHaveCount(0);

  await page.evaluate(
    ({ key }) =>
      window.localStorage.setItem(key, JSON.stringify({ leads: [] })),
    { key: STORAGE_KEY },
  );
  await page.reload();

  await expect(page.getByTestId("crm-app")).toHaveAttribute(
    "data-ready",
    "true",
  );
  await expect(page.getByTestId("lead-card")).toHaveCount(0);
});

test("restores only valid stored leads", async ({ page }) => {
  await page.evaluate(
    ({ key }) => {
      const validLead = {
        id: "valid-lead",
        name: "Ольга Соколова",
        phone: "+7 911 000-11-22",
        source: "Холодный",
        owner: "Лидоруб",
        stage: "Квалифицирован",
        specRequested: false,
        createdAt: "2026-07-29T09:00:00.000Z",
      };
      const invalidLead = {
        ...validLead,
        id: "invalid-lead",
        name: "Повреждённая запись",
        createdAt: "not-a-date",
      };

      window.localStorage.setItem(
        key,
        JSON.stringify([invalidLead, validLead]),
      );
    },
    { key: STORAGE_KEY },
  );
  await page.reload();

  await expect(page.getByTestId("crm-app")).toHaveAttribute(
    "data-ready",
    "true",
  );
  await expect(page.getByTestId("lead-card")).toHaveCount(1);
  await expect(page.getByTestId("lead-card")).toContainText("Ольга Соколова");
  await expect(page.getByText("Повреждённая запись")).toHaveCount(0);
});

test("reports a storage write failure without a false success", async ({
  page,
}) => {
  await page.evaluate(() => {
    Storage.prototype.setItem = () => {
      throw new DOMException("Storage disabled", "QuotaExceededError");
    };
  });

  await page.getByLabel("Имя клиента").fill("Пётр Орлов");
  await page.getByLabel("Номер телефона").fill("+7 900 111-22-33");
  await page.getByRole("button", { name: "Сохранить лида" }).click();

  await expect(
    page.getByText("Не удалось сохранить лид. Проверьте настройки браузера."),
  ).toBeVisible();
  await expect(page.getByTestId("lead-card")).toHaveCount(0);
});
