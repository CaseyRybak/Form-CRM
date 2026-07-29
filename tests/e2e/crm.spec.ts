import { expect, test } from "@playwright/test";

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

  await expect(page.getByText("Введите имя клиента")).toBeVisible();
  await expect(page.getByText("Введите номер телефона")).toBeVisible();
  await expect(page.getByTestId("lead-card")).toHaveCount(0);
});

test("creates a lead and restores it after reload", async ({ page }) => {
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
  await expect(card).toContainText("ТЗ");
  await expect(card.getByTestId("lead-stage")).toHaveText("Новый лид");

  await page.reload();
  await expect(page.getByTestId("lead-card")).toContainText("Анна Смирнова");
});

test("changes the stage and persists the update", async ({ page }) => {
  await page.getByLabel("Имя клиента").fill("Иван Петров");
  await page.getByLabel("Номер телефона").fill("+7 900 000-00-00");
  await page.getByRole("button", { name: "Сохранить лида" }).click();

  const card = page.getByTestId("lead-card");
  await card
    .getByRole("button", { name: "Изменить этап сделки для Иван Петров" })
    .click();
  await expect(card.getByTestId("lead-stage")).toHaveText("Квалифицирован");

  await page.reload();
  await expect(
    page.getByTestId("lead-card").getByTestId("lead-stage"),
  ).toHaveText("Квалифицирован");
});
