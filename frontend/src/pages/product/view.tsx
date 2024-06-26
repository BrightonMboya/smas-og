// dependencies
import React from "react";
import { Link } from "react-router-dom";
import { FloatingButton } from "../../components/button";
import Dialog from "../../components/dialog";
import {
  apiV1,
  noAccess,
  number,
  pageNotFound,
  productListsView,
  setPageTitle,
  text,
} from "../../helpers";
import {
  listView,
  readOrDelete,
  routerProps,
  serverResponse,
} from "../../types";
import { can } from "../../helpers/permissions";
import translate from "../../helpers/translator";
import { ApplicationContext } from "../../context";
import ViewDetail from "../../components/view-detail";
import { array } from "fast-web-kit";

// product view memorized functional component
const ProductView: React.FunctionComponent<routerProps> = React.memo(
  (props: routerProps) => {
    // application context
    const { application } = React.useContext(ApplicationContext);

    // component mounting
    React.useEffect(function () {
      // checking user permission
      if (can("view_product")) {
        // checking if router state has values
        if (props.location.state) {
          // getting product from router state
          const { product }: any = props.location.state;

          // checking if product has been passed on router state
          if (product) {
            setPageTitle("view product");
            onMount(product);
            application.dispatch({
              ids: [product],
              schema: "product",
              collection: "products",
            });
          } else props.history.goBack();
        } else props.history.goBack();
      } else {
        props.history.push(pageNotFound);
        application.dispatch({ notification: noAccess });
      }

      // component unmounting
      return () => application.unMount();

      // eslint-disable-next-line
    }, []);

    // loading product data
    async function onMount(_id: string): Promise<void> {
      try {
        // parameters, condition, select and foreign key
        const condition: string = JSON.stringify({ _id });
        const select: string = JSON.stringify({});
        const joinForeignKeys: boolean = true;
        const parameters: string = `schema=product&condition=${condition}&select=${select}&joinForeignKeys=${joinForeignKeys}`;

        // request options
        const options: readOrDelete = {
          route: apiV1 + "read",
          method: "GET",
          loading: true,
          disabled: false,
          parameters,
        };

        // api request
        const response: serverResponse = await application.readOrDelete(
          options
        );

        if (response.success)
          application.dispatch({ product: response.message });
        else application.dispatch({ notification: response.message });
      } catch (error) {
        application.dispatch({ notification: (error as Error).message });
      }
    }

    // returning component view
    return (
      <>
        <div className="row">
          <div className="col s12 m5 l4">
            <div className="view">
              <div className="view-profile">
                <div className="view-initials">
                  {text.abbreviate(
                    application.state[application.state.schema]?.name
                  )}
                </div>
                <div className="view-title">
                  <span>
                    {text.reFormat(
                      application.state[application.state.schema]?.name
                    )}
                  </span>
                  {application.state[application.state.schema]?.stock <= 0 &&
                  application.state[application.state.schema]?.visible ? (
                    <i
                      className="material-icons-round text-error blink"
                      title="Out of stock">
                      warning
                    </i>
                  ) : application.state[application.state.schema]?.stock > 0 &&
                    application.state[application.state.schema]?.stock <=
                      application.state[application.state.schema]
                        ?.reorder_stock_level &&
                    application.state[application.state.schema]?.visible ? (
                    <i
                      className="material-icons-round text-warning"
                      title="Almost out of stock">
                      warning
                    </i>
                  ) : application.state[application.state.schema]?.visible ? (
                    <i
                      className="material-icons-round text-success"
                      title="Stock available">
                      hourglass_full
                    </i>
                  ) : (
                    <i
                      className="material-icons-round text-error"
                      title="Deleted product">
                      delete
                    </i>
                  )}
                </div>
              </div>
              <div className="view-items">
                <div className="view-item active">
                  <i className="material-icons-round">info</i>
                  <div className="title">
                    {translate("product information")}
                  </div>
                </div>
                {array
                  .sort(productListsView, "asc", "link")
                  .map((productListView: listView, index: number) => {
                    if (
                      productListView.visible &&
                      application.state[application.state.schema]?.visible
                    )
                      return (
                        <Link
                          to={{
                            pathname: `${productListView.link}`,
                            state: {
                              product:
                                application.state[application.state.schema],
                              propsCondition: {
                                product:
                                  application.state[application.state.schema]
                                    ?._id,
                              },
                            },
                          }}
                          className="view-item"
                          key={index}>
                          <i className="material-icons-round">chevron_right</i>
                          <div className="title">
                            {translate(productListView.name)}
                          </div>
                        </Link>
                      );
                    else return null;
                  })}
                {(can("edit_product") ||
                  can("delete_product") ||
                  can("edit_store_product") ||
                  can("delete_store_product")) &&
                application.state[application.state.schema]?.visible ? (
                  <>
                    {can("edit_product") || can("edit_store_product") ? (
                      <Link
                        to={{
                          pathname: application.state.product?.is_store_product
                            ? "/store/product-form"
                            : `/product/form`,
                          state: {
                            product:
                              application.state[application.state.schema]?._id,
                          },
                        }}
                        className="view-item">
                        <i className="material-icons-round text-success">
                          edit_note
                        </i>
                        <div className="title">{translate("edit")}</div>
                      </Link>
                    ) : null}
                    {can("delete_product") || can("delete_store_product") ? (
                      <Link
                        to="#"
                        className="view-item"
                        onClick={() => application.openDialog("deleted")}>
                        <i className="material-icons-round text-error">
                          delete
                        </i>
                        <div className="title">{translate("delete")}</div>
                      </Link>
                    ) : null}
                  </>
                ) : can("restore_deleted") &&
                  !application.state[application.state.schema]?.visible ? (
                  <Link
                    to="#"
                    className="view-item"
                    onClick={() => application.openDialog("restored")}>
                    <i className="material-icons-round text-warning">
                      restore_from_trash
                    </i>
                    <div className="title">{translate("restore")}</div>
                  </Link>
                ) : null}
              </div>
            </div>
          </div>
          <div className="col s12 m7 l8">
            <div className="view">
              <div className="view-header">
                <div className="title">
                  <span>{translate("product information")}</span>
                </div>
              </div>
              <div className="view-items">
                <div className="row">
                  <div className="col s12">
                    <div className="view-detail">
                      <div className="label">{translate("barcode")}:</div>
                      <div className="title">
                        {application.state[application.state.schema]?.barcode
                          ? application.state[application.state.schema]?.barcode
                          : translate("n/a")}
                      </div>
                    </div>
                  </div>
                </div>
                {can("view_buying_price") || can("view_selling_price") ? (
                  <div className="row">
                    {can("view_buying_price") ? (
                      <div
                        className={`col s12 ${
                          can("view_selling_price") ? "m6 l6" : ""
                        }`}>
                        <div className="view-detail">
                          <div className="label">
                            {translate("buying price")}:
                          </div>
                          <div className="title">
                            {number.format(
                              application.state[application.state.schema]
                                ?.buying_price
                            )}
                          </div>
                        </div>
                      </div>
                    ) : null}
                    {can("view_selling_price") ? (
                      <div
                        className={`col s12 ${
                          can("view_buying_price") ? "m6 l6" : ""
                        }`}>
                        <div className="view-detail">
                          <div className="label">
                            {translate("selling price")}:
                          </div>
                          <div className="title">
                            {number.format(
                              application.state[application.state.schema]
                                ?.selling_price
                            )}
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : null}
                <div className="row">
                  {can("view_stock") ? (
                    <div className="col s12 m6 l6">
                      <div className="view-detail">
                        <div className="label">
                          {translate("stock available")}:
                        </div>
                        <div className="title">
                          {number.format(
                            application.state[application.state.schema]?.stock
                          )}
                        </div>
                      </div>
                    </div>
                  ) : null}
                  <div
                    className={`col s12 ${can("view_stock") ? "m6 l6" : ""}`}>
                    <div className="view-detail">
                      <div className="label">{translate("sold")}:</div>
                      <div className="title">
                        {number.format(
                          application.state[application.state.schema]
                            ?.quantity -
                            application.state[application.state.schema]?.stock
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="row">
                  <div className="col s12 m6 l6">
                    <div className="view-detail">
                      <div className="label">
                        {translate("reorder stock level")}:
                      </div>
                      <div className="title">
                        {number.format(
                          application.state[application.state.schema]
                            ?.reorder_stock_level
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="col s12 m6 l6">
                    <div className="view-detail">
                      <div className="label">{translate("status")}:</div>
                      <div
                        className={`title
                                        ${
                                          application.state[
                                            application.state.schema
                                          ]?.stock <= 0 &&
                                          application.state[
                                            application.state.schema
                                          ]?.visible
                                            ? "text-error blink"
                                            : application.state[
                                                application.state.schema
                                              ]?.stock > 0 &&
                                              application.state[
                                                application.state.schema
                                              ]?.stock <=
                                                application.state[
                                                  application.state.schema
                                                ]?.reorder_stock_level &&
                                              application.state[
                                                application.state.schema
                                              ]?.visible
                                            ? "text-warning"
                                            : application.state[
                                                application.state.schema
                                              ]?.visible
                                            ? "text-success"
                                            : "text-error bold"
                                        }
                                        `}>
                        {translate(
                          application.state[application.state.schema]?.stock <=
                            0 &&
                            application.state[application.state.schema]?.visible
                            ? "Out of stock"
                            : application.state[application.state.schema]
                                ?.stock > 0 &&
                              application.state[application.state.schema]
                                ?.stock <=
                                application.state[application.state.schema]
                                  ?.reorder_stock_level &&
                              application.state[application.state.schema]
                                ?.visible
                            ? "Almost out of stock"
                            : application.state[application.state.schema]
                                ?.visible
                            ? "available"
                            : "deleted"
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <ViewDetail />
              </div>
            </div>
          </div>
        </div>
        <Dialog
          title="product Confirmation"
          text={`Are you sure you what to ${application.state.backendStatus} ${
            application.state.ids.length > 1 ? "these products" : "this product"
          }?`}
          action={application.updateBackendStatus}
          toggleDialog={application.toggleComponent}
        />
        {can("list_product") || can("list_store_product") ? (
          <FloatingButton
            to={
              application.state.product?.is_store_product
                ? "/store/product-list"
                : "/product/list"
            }
            tooltip={
              application.state.product?.is_store_product
                ? "list store products"
                : "list products"
            }
            icon="list_alt"
          />
        ) : null}
      </>
    );
  }
);

// exporting component
export default ProductView;
