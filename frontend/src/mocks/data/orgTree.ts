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
            id: "d1",
            name: "ТриниДата",
            type: "department",
            children: [
              {
                id: "t1",
                name: "Основное подразделение",
                type: "team",
                children: [
                  {
                    id: "e1",
                    name: "Иванов Сергей",
                    type: "employee",
                    employeeId: "e1",
                  },
                  {
                    id: "e2",
                    name: "Смирнова Анна",
                    type: "employee",
                    employeeId: "e2",
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
];



