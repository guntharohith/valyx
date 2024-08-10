import { useState } from "react";
import "./App.css";
import SelectCategoryDropdown from "./components/SelectCategoryDropdown";

function App() {
  const [selectedCategories, setSelectedCategories] = useState([]);

  const handleCategoriesChange = (categories) => {
    setSelectedCategories(categories);
  };

  return (
    <SelectCategoryDropdown
      selectedCategories={selectedCategories}
      onChange={handleCategoriesChange}
    />
  );
}

export default App;
