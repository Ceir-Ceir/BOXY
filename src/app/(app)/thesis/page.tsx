import { PageTitle } from "@/components/ui";
import ThesisStudio from "./ThesisStudio";

export const metadata = { title: "Thesis & Strategic Pitch Studio" };

export default async function ThesisPage() {
  return (
    <>
      <PageTitle
        eyebrow="War Room"
        title="BredBox Thesis & Pitch Studio"
      >
        The foundational strategy deck, market TAM calculator, and executive pitch memo for Breadbox.
      </PageTitle>
      <ThesisStudio />
    </>
  );
}
