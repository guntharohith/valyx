import React, { useState } from "react";
import { Box, Menu, Typography } from "@mui/material";
import {
  CheckBox,
  CheckBoxOutlineBlank,
  KeyboardArrowDownOutlined,
} from "@mui/icons-material";
import { categoryRelation } from "../data/categoryRelation";
import { idToNameMap } from "../data/idToNameMap";

const data = removeDiffNodes(categoryRelation);

function SelectCategoryDropdown({ selectedCategories, onChange }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleCategory = (category) => {
    let tempSelectedCategories = [...selectedCategories];
    toggleSelection(category, tempSelectedCategories);
    updateParentSelections(data, tempSelectedCategories);
    onChange(Array.from(new Set(tempSelectedCategories)));
  };

  return (
    <Box display={"flex"} justifyContent={"center"} pt={5}>
      <Box
        onClick={handleClick}
        sx={{
          display: "inline-block",
          border: "1px solid gray",
          borderRadius: 1,
        }}
      >
        <Box
          display={"flex"}
          alignItems={"center"}
          py={1}
          px={1.5}
          sx={{ cursor: "pointer" }}
        >
          <Typography sx={{ width: 200 }} noWrap>
            {selectedCategories.length > 0
              ? selectedCategories.map((c) => idToNameMap[c]).join()
              : "Select Categories"}
          </Typography>
          <Box mr={1} />
          <KeyboardArrowDownOutlined />
        </Box>
      </Box>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        slotProps={{
          paper: {
            style: {
              maxHeight: 500,
              maxWidth: 300,
              overflow: "auto",
              marginTop: 8,
              borderRadius: 8,
            },
          },
        }}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "center",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "center",
        }}
      >
        {Object.keys(data).map((key) => {
          const item = data[key];
          return (
            <DropdownItem
              key={key}
              item={item}
              selectedCategories={selectedCategories}
              handleCategory={handleCategory}
            />
          );
        })}
      </Menu>
    </Box>
  );
}

function DropdownItem({ item, selectedCategories, handleCategory }) {
  const { children, categoryValue } = item;
  const selectedStatus = determineStatus(item, selectedCategories);

  return (
    !categoryValue.includes("_diffnode") && (
      <Box>
        <Box
          display={"flex"}
          alignItems={"center"}
          sx={{ cursor: "pointer", padding: "6px 16px" }}
          onClick={() => handleCategory(item)}
        >
          <CustomCheckBox status={selectedStatus} />
          <Box mr={1} />
          <Typography>{categoryValue}</Typography>
        </Box>
        {children && (
          <Box ml={2}>
            {Object.keys(children).map((key) => {
              const child = children[key];
              return (
                <DropdownItem
                  key={key}
                  item={child}
                  selectedCategories={selectedCategories}
                  handleCategory={handleCategory}
                />
              );
            })}
          </Box>
        )}
      </Box>
    )
  );
}

function determineStatus(node, selectedIds) {
  // Leaf node
  if (!node.children) {
    return selectedIds.includes(node.categoryId) ? "selected" : "unselected";
  }

  // Non-leaf node
  const childStatuses = Object.values(node.children).map((child) =>
    determineStatus(child, selectedIds)
  );

  // Check if all children are selected
  if (childStatuses.every((status) => status === "selected")) {
    return "selected";
  }

  // Check if any child is selected or partially selected
  if (
    childStatuses.some(
      (status) => status === "selected" || status === "partially_selected"
    )
  ) {
    return "partially_selected";
  }

  return "unselected";
}

function removeDiffNodes(data) {
  // Helper function to remove nodes with suffix _diffnode from children
  const removeDiffChildren = (children) => {
    if (!children) return null;
    return Object.keys(children).reduce((acc, key) => {
      const child = children[key];
      if (child.categoryValue && child.categoryValue.endsWith("_diffnode")) {
        return acc; // Remove node
      } else {
        acc[key] = { ...child, children: removeDiffChildren(child.children) };
        return acc;
      }
    }, {});
  };

  return Object.keys(data).reduce((acc, key) => {
    const node = data[key];
    if (node.categoryValue && node.categoryValue.endsWith("_diffnode")) {
      return acc; // Remove node
    } else {
      acc[key] = { ...node, children: removeDiffChildren(node.children) };
      return acc;
    }
  }, {});
}

function toggleSelection(node, selectedIds) {
  if (!node.children) {
    if (selectedIds.includes(node.categoryId)) {
      // Remove from selectedIds
      selectedIds.splice(selectedIds.indexOf(node.categoryId), 1);
    } else {
      // Add to selectedIds
      selectedIds.push(node.categoryId);
    }
  } else {
    toggleSelectionUtil(node, selectedIds);
  }

  function toggleSelectionUtil(node, selectedIds, remove = false) {
    const isLeaf = !node.children;

    if (isLeaf) {
      if (remove) {
        // Remove from selectedIds
        selectedIds.splice(selectedIds.indexOf(node.categoryId), 1);
      } else {
        // Add to selectedIds
        selectedIds.push(node.categoryId);
      }
      return;
    }

    const isCurrentlySelected = selectedIds.includes(node.categoryId);

    if (isCurrentlySelected) {
      // Deselect node and all children
      const nodeIndex = selectedIds.indexOf(node.categoryId);
      if (nodeIndex !== -1) {
        selectedIds.splice(nodeIndex, 1);
      }
      Object.values(node.children).forEach((child) =>
        toggleSelectionUtil(child, selectedIds, true)
      );
    } else {
      // Select node and all children
      selectedIds.push(node.categoryId);
      Object.values(node.children).forEach((child) =>
        toggleSelectionUtil(child, selectedIds, false)
      );
    }
  }
}

function updateParentSelections(data, selectedCategoryIds) {
  const checkAndUpdate = (node) => {
    if (!node.children) return; // Leaf node

    const allChildrenSelected = Object.values(node.children).every((child) =>
      selectedCategoryIds.includes(child.categoryId)
    );

    const parentIndex = selectedCategoryIds.indexOf(node.categoryId);

    if (allChildrenSelected && parentIndex === -1) {
      selectedCategoryIds.push(node.categoryId);
    } else if (!allChildrenSelected) {
      if (parentIndex !== -1) {
        selectedCategoryIds.splice(parentIndex, 1);
      }
    }

    Object.values(node.children).forEach((child) => checkAndUpdate(child));
  };

  Object.values(data).forEach((node) => checkAndUpdate(node));
}

function CustomCheckBox({ status }) {
  if (status === "unselected") {
    return <CheckBoxOutlineBlank />;
  } else if (status === "partially_selected") {
    return <CheckBox sx={{ color: "#8E8C8B" }} />;
  }
  return <CheckBox />;
}

export default SelectCategoryDropdown;
