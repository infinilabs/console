import React from "react";
import { Input } from "antd";
import { formatMessage } from "umi/locale";

const { Search } = Input;

const normalizePlaceholder = (placeholder) => {
  if (typeof placeholder === "undefined") {
    return formatMessage({ id: "listview.search.placeholder" });
  }

  if (typeof placeholder !== "string") {
    return placeholder;
  }

  const normalizedPlaceholder = placeholder.trim().toLowerCase();
  if (
    normalizedPlaceholder === "type keyword to search" ||
    normalizedPlaceholder === "search" ||
    normalizedPlaceholder === "keyword"
  ) {
    return formatMessage({ id: "listview.search.placeholder" });
  }

  return placeholder;
};

const normalizeEnterButton = (enterButton) => {
  if (typeof enterButton === "undefined") {
    return formatMessage({ id: "form.button.search" });
  }

  if (typeof enterButton !== "string") {
    return enterButton;
  }

  const normalizedEnterButton = enterButton.trim();
  if (
    normalizedEnterButton.toLowerCase() === "search" ||
    normalizedEnterButton === "搜索"
  ) {
    return formatMessage({ id: "form.button.search" });
  }

  return enterButton;
};

const SearchInput = ({ placeholder, enterButton, ...props }) => {
  return (
    <Search
      {...props}
      placeholder={normalizePlaceholder(placeholder)}
      enterButton={normalizeEnterButton(enterButton)}
    />
  );
};

export default SearchInput;
