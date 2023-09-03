import Select from "react-select";

type SelectProps = {
  name: string;
  options: {
    value: string;
    label: string;
  }[];
};

const CustomSelect = ({ name, options }: SelectProps) => {
  return (
    <>
      <Select
        className="text-sm bg-gray-600 text-gray-300 mt-1"
        menuPlacement="auto"
        name={name}
        options={options}
        styles={{
          control: (baseStyles) => ({
            ...baseStyles,
            borderColor: "rgb(75 85 99)",
          }),
          container: (baseStyles) => ({
            ...baseStyles,
            borderRadius: "3px",
          }),
          option: (baseStyles) => ({
            ...baseStyles,
            color: "rgb(209 213 219)",
          }),
        }}
        theme={(theme) => ({
          ...theme,
          colors: {
            ...theme.colors,
            neutral0: "rgb(75 85 99)",
            neutral20: "rgb(209 213 219)",
            neutral30: "rgb(209 213 219)",
            neutral40: "rgb(209 213 219)",
            neutral50: "rgb(209 213 219)",
            neutral60: "rgb(209 213 219)",
            neutral70: "rgb(209 213 219)",
            neutral80: "rgb(209 213 219)",
            neutral90: "rgb(209 213 219)",
            primary25: "rgb(107 114 128)",
            primary50: "rgb(129 140 248)",
            primary: "rgb(99 102 241)",
          },
        })}
      />
    </>
  );
};
export default CustomSelect;
