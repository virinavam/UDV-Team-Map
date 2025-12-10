import type { OrgNode } from "../../types/types";

export const orgTree: OrgNode[] = [
  {
    id: "c1",
    name: "UDV Group",
    type: "company",
    children: [
      {
        id: "le1",
        name: "UDV Digital Transforamtion",
        type: "legal_entity",
        children: [
          {
            id: "dept1",
            name: "ВНЕ ОЧЕРЕДИ",
            type: "department",
            children: [],
          },
          {
            id: "dept2",
            name: "ФТ-СОФТ",
            type: "department",
            children: [
              {
                id: "dept2-1",
                name: "Основное подразделение",
                type: "department",
                children: [
                  {
                    id: "dept2-1-1",
                    name: "Направление аналитики и документации",
                    type: "department",
                    children: [],
                  },
                ],
              },
              {
                id: "dept2-2",
                name: "Отдел продуктовой разработки",
                type: "department",
                children: [],
              },
              {
                id: "dept2-3",
                name: "Отдел продуктовой разработки 2",
                type: "department",
                children: [],
              },
              {
                id: "dept2-4",
                name: "Отдел заказной разработки",
                type: "department",
                children: [],
              },
            ],
          },
          {
            id: "dept3",
            name: "Администрация",
            type: "department",
            children: [],
          },
          {
            id: "dept4",
            name: "Отдел продуктовой разработки 1",
            type: "department",
            children: [],
          },
        ],
      },
      {
        id: "le2",
        name: "UDV Security",
        type: "legal_entity",
        children: [],
      },
      {
        id: "le3",
        name: "UDV Services",
        type: "legal_entity",
        children: [],
      },
    ],
  },
];
