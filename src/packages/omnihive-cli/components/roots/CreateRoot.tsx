import React from "react";
import { useAtom } from "jotai";
import { createInstanceModelAtom, currentPageAtom, moveToNewPageAtom } from "../../stores/CommandLineStore";
import { CommandLinePage } from "../../enums/CommandLinePage";
import ChooseDataSource from "../common/ChooseDataSource";
import { DataSourceType } from "../../enums/DataSourceType";
import { CommandLineModule } from "../../enums/CommandLineModule";
import TextBox from "../common/TextBox";

const CreateRoot: React.FC = (): React.ReactElement => {
    const [currentPage] = useAtom(currentPageAtom);
    const [createInstanceModel, setCreateInstanceRoot] = useAtom(createInstanceModelAtom);
    const [, moveToNewPage] = useAtom(moveToNewPageAtom);

    const onSelectDataSource = (dataSourceType: DataSourceType) => {
        setCreateInstanceRoot({ ...createInstanceModel, dataSourceType });

        if (
            dataSourceType === DataSourceType.JSON ||
            dataSourceType === DataSourceType.SQLite ||
            dataSourceType === DataSourceType.YAML
        ) {
            moveToNewPage({
                module: CommandLineModule.Create,
                page: CommandLinePage.CreateInstance_ChooseFileLocation,
            });
        }
    };

    const onSelectConfigFilePath = (filePath: string) => {
        console.log(filePath);
    };

    return (
        <>
            {(currentPage === CommandLinePage.CreateInstance_Root ||
                currentPage === CommandLinePage.CreateInstance_DataSource) && (
                <ChooseDataSource
                    selectedDataSource={createInstanceModel.dataSourceType}
                    onDataSourceChange={onSelectDataSource}
                />
            )}
            {currentPage === CommandLinePage.CreateInstance_ChooseFileLocation &&
                createInstanceModel.dataSourceType === DataSourceType.JSON && (
                    <TextBox
                        selectedText={createInstanceModel.configFilePath}
                        onTextChange={onSelectConfigFilePath}
                        title={"JSON file"}
                    />
                )}
        </>
    );
};

export default CreateRoot;
