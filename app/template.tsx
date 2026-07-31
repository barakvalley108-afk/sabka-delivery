import CustomerNavigationEnhancer from "./components/customer-navigation-enhancer";

export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <>
      <CustomerNavigationEnhancer />
      {children}
    </>
  );
}
